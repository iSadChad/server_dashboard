export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { execFileSync } from "child_process";

const EXPECTED_PROCESSES = ["server-dashboard", "metrics-collector"];

function formatUptimeFromMs(value) {
  if (!value) return null;

  const diffMs = Date.now() - Number(value);
  const totalSeconds = Math.max(Math.floor(diffMs / 1000), 0);

  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);

  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function getPm2List() {
  const output = execFileSync("bash", ["-lc", "pm2 jlist"], {
    timeout: 10000,
    env: {
      ...process.env,
      PM2_HOME: process.env.PM2_HOME || "/home/sadchad/.pm2",
      PATH: `${process.env.PATH || ""}:/usr/local/bin:/usr/bin:/bin`,
    },
  }).toString();

  return JSON.parse(output);
}

export async function GET() {
  try {
    const list = getPm2List();

    const processes = list.map((process) => {
      const env = process.pm2_env || {};
      const monit = process.monit || {};

      return {
        name: process.name,
        id: process.pm_id,
        pid: process.pid || null,
        status: env.status || "unknown",
        restarts: env.restart_time ?? 0,
        uptime: formatUptimeFromMs(env.pm_uptime),
        uptimeStartedAt: env.pm_uptime || null,
        memory: monit.memory || 0,
        cpu: monit.cpu || 0,
      };
    });

    const expected = EXPECTED_PROCESSES.map((name) => {
      const found = processes.find((process) => process.name === name);

      return {
        name,
        found: Boolean(found),
        status: found?.status || "missing",
      };
    });

    const hasProblem = expected.some(
      (process) => !process.found || process.status !== "online"
    );

    return Response.json({
      status: hasProblem ? "warning" : "ok",
      message: hasProblem
        ? "One or more expected PM2 processes are not online"
        : "All expected PM2 processes are online",
      expected,
      processes,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Failed to read PM2 status:", error);

    return Response.json(
      {
        status: "error",
        message: "Could not read PM2 process status",
        expected: EXPECTED_PROCESSES.map((name) => ({
          name,
          found: false,
          status: "unknown",
        })),
        processes: [],
        updatedAt: new Date().toISOString(),
        details: error.message,
      },
      { status: 500 }
    );
  }
}
