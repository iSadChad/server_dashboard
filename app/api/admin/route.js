export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { execFile } from "child_process";
import { promisify } from "util";
import { existsSync } from "fs";
import net from "net";

const execFileAsync = promisify(execFile);

const SERVICE_CHECKS = [
  {
    name: "Dashboard",
    type: "http",
    target: "http://127.0.0.1:3000",
  },
  {
    name: "Nextcloud",
    type: "http",
    target: "http://127.0.0.1",
  },
  {
    name: "Stirling PDF",
    type: "http",
    target: "http://127.0.0.1:8081",
  },
  {
    name: "SnapOtter",
    type: "http",
    target: "http://127.0.0.1:1349",
  },
  {
    name: "PostgreSQL",
    type: "tcp",
    host: "127.0.0.1",
    port: 5432,
  },
];

const STORAGE_PATHS = [
  {
    label: "ServerFiles",
    path: "/home/sadchad/ServerFiles",
  },
  {
    label: "Backups",
    path: "/mnt/backups/restic-repo",
  },
  {
    label: "Nextcloud snap",
    path: "/var/snap/nextcloud",
  },
  {
    label: "Dashboard project",
    path: "/home/sadchad/dashboard/server_dashboard",
  },
];

async function runCommand(command, args = [], timeout = 5000) {
  try {
    const { stdout, stderr } = await execFileAsync(command, args, {
      timeout,
      maxBuffer: 1024 * 1024,
    });

    return {
      ok: true,
      stdout: stdout || "",
      stderr: stderr || "",
      error: null,
    };
  } catch (error) {
    return {
      ok: false,
      stdout: error.stdout || "",
      stderr: error.stderr || "",
      error: error.message,
    };
  }
}

function formatBytes(bytes) {
  const value = Number(bytes || 0);

  if (value <= 0) return "0 B";

  const units = ["B", "KB", "MB", "GB", "TB"];
  const index = Math.min(
    Math.floor(Math.log(value) / Math.log(1024)),
    units.length - 1
  );

  return `${(value / Math.pow(1024, index)).toFixed(index === 0 ? 0 : 1)} ${
    units[index]
  }`;
}

function parseAptList(stdout) {
  const packages = stdout
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !line.toLowerCase().startsWith("listing"))
    .map((line) => {
      const [namePart] = line.split("/");
      return namePart || line;
    });

  return {
    pending: packages.length,
    packages: packages.slice(0, 10),
  };
}

function parseOpenPorts(stdout) {
  const ports = new Set();

  stdout
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("tcp") || line.startsWith("udp"))
    .forEach((line) => {
      const parts = line.split(/\s+/);
      const localAddress = parts[4] || "";
      const port = localAddress.split(":").pop();

      if (port && /^\d+$/.test(port)) {
        ports.add(port);
      }
    });

  return [...ports].sort((a, b) => Number(a) - Number(b));
}

function parseLastLogins(stdout) {
  return stdout
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !line.startsWith("wtmp"))
    .filter((line) => !line.startsWith("reboot"))
    .filter((line) => !line.startsWith("shutdown"))
    .slice(0, 5);
}

function countFailedLogins(stdout) {
  const matches = stdout.match(
    /failed password|invalid user|authentication failure/gi
  );

  return matches ? matches.length : 0;
}

async function checkHttpService(service) {
  const startedAt = Date.now();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2500);

  try {
    const response = await fetch(service.target, {
      method: "GET",
      cache: "no-store",
      signal: controller.signal,
    });

    return {
      name: service.name,
      type: service.type,
      target: service.target,
      status: response.status < 500 ? "online" : "warning",
      code: response.status,
      responseMs: Date.now() - startedAt,
    };
  } catch (error) {
    return {
      name: service.name,
      type: service.type,
      target: service.target,
      status: "offline",
      code: null,
      responseMs: null,
      error: error.message,
    };
  } finally {
    clearTimeout(timeout);
  }
}

function checkTcpService(service) {
  return new Promise((resolve) => {
    const startedAt = Date.now();
    const socket = new net.Socket();

    socket.setTimeout(2500);

    socket.once("connect", () => {
      socket.destroy();

      resolve({
        name: service.name,
        type: service.type,
        host: service.host,
        port: service.port,
        status: "online",
        responseMs: Date.now() - startedAt,
      });
    });

    socket.once("timeout", () => {
      socket.destroy();

      resolve({
        name: service.name,
        type: service.type,
        host: service.host,
        port: service.port,
        status: "offline",
        responseMs: null,
        error: "Connection timed out",
      });
    });

    socket.once("error", (error) => {
      socket.destroy();

      resolve({
        name: service.name,
        type: service.type,
        host: service.host,
        port: service.port,
        status: "offline",
        responseMs: null,
        error: error.message,
      });
    });

    socket.connect(service.port, service.host);
  });
}

async function getServiceHealth() {
  const checks = SERVICE_CHECKS.map((service) => {
    if (service.type === "http") return checkHttpService(service);
    if (service.type === "tcp") return checkTcpService(service);

    return Promise.resolve({
      name: service.name,
      type: service.type,
      status: "unknown",
    });
  });

  return Promise.all(checks);
}

async function getStorageFolders() {
  const results = [];

  for (const item of STORAGE_PATHS) {
    if (!existsSync(item.path)) {
      results.push({
        ...item,
        exists: false,
        bytes: 0,
        size: "Missing",
      });

      continue;
    }

    const result = await runCommand("du", ["-sb", item.path], 8000);
    const bytes = result.ok ? Number(result.stdout.split(/\s+/)[0] || 0) : 0;

    results.push({
      ...item,
      exists: true,
      bytes,
      size: result.ok ? formatBytes(bytes) : "Error",
      error: result.ok ? null : result.error,
    });
  }

  return results;
}

export async function GET() {
  try {
    const [
      hostname,
      kernel,
      uptime,
      ufw,
      ufwService,
      sshActive,
      sshEnabled,
      openPorts,
      aptUpdates,
      lastLogins,
      sshLogs,
      systemErrors,
      services,
      storageFolders,
    ] = await Promise.all([
      runCommand("hostname"),
      runCommand("uname", ["-r"]),
      runCommand("uptime", ["-p"]),
      runCommand("ufw", ["status"]),
      runCommand("systemctl", ["is-active", "ufw"]),
      runCommand("systemctl", ["is-active", "ssh"]),
      runCommand("systemctl", ["is-enabled", "ssh"]),
      runCommand("ss", ["-tuln"]),
      runCommand("apt", ["list", "--upgradable"], 10000),
      runCommand("last", ["-n", "5", "-w"]),
      runCommand("journalctl", [
        "-u",
        "ssh",
        "--since",
        "today",
        "--no-pager",
        "-n",
        "200",
      ]),
      runCommand("journalctl", ["-p", "err", "-n", "30", "--no-pager"]),
      getServiceHealth(),
      getStorageFolders(),
    ]);

    const updatesInfo = parseAptList(aptUpdates.stdout);

    const ufwText = `${ufw.stdout} ${ufw.stderr} ${ufw.error || ""}`.toLowerCase();
    const ufwServiceText = `${ufwService.stdout} ${ufwService.stderr} ${
      ufwService.error || ""
    }`.toLowerCase();

    let firewallStatus = "unknown";

    if (ufwText.includes("status: active")) {
      firewallStatus = "active";
    } else if (ufwText.includes("status: inactive")) {
      firewallStatus = "inactive";
    } else if (ufwServiceText.trim() === "active") {
      firewallStatus = "active";
    } else if (ufwServiceText.trim() === "inactive") {
      firewallStatus = "inactive";
    }

    return Response.json({
      status: "ok",
      updatedAt: new Date().toISOString(),

      system: {
        hostname: hostname.stdout.trim() || "unknown",
        kernel: kernel.stdout.trim() || "unknown",
        uptime: uptime.stdout.trim() || "unknown",
        rebootRequired: existsSync("/var/run/reboot-required"),
      },

      security: {
        firewall: firewallStatus,
        ssh: {
          active: sshActive.stdout.trim() || "unknown",
          enabled: sshEnabled.stdout.trim() || "unknown",
        },
        failedLoginsToday: countFailedLogins(sshLogs.stdout),
        openPorts: parseOpenPorts(openPorts.stdout),
        lastLogins: parseLastLogins(lastLogins.stdout),
      },

      updates: {
        pending: updatesInfo.pending,
        packages: updatesInfo.packages,
      },

      services,

      storage: {
        folders: storageFolders,
      },

      logs: {
        ssh: sshLogs.ok
          ? sshLogs.stdout.split("\n").slice(-25)
          : [`Could not read SSH logs: ${sshLogs.error}`],

        systemErrors: systemErrors.ok
          ? systemErrors.stdout.split("\n").slice(-25)
          : [`Could not read system errors: ${systemErrors.error}`],
      },
    });

  } catch (error) {
    console.error("Failed to load admin status:", error);

    return Response.json(
      {
        status: "error",
        message: "Could not load admin status",
        details: error.message,
        updatedAt: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
