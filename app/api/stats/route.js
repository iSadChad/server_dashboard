import { execSync } from "child_process";
import os from "os";

export async function GET() {
  let cpu = 0;
  let memory = { used: 0, total: 0 };
  let disk = { used: 0, total: 0 };
  let uptime = 0;

  try {
    uptime = Math.floor(os.uptime());

    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    memory = { used: totalMem - freeMem, total: totalMem };

    try {
      const cpuLoad = os.loadavg()[0];
      const cpuCount = os.cpus().length;
      cpu = Math.min((cpuLoad / cpuCount) * 100, 100);
    } catch {
      cpu = 0;
    }

    try {
      if (process.platform === "win32") {
        const output = execSync(
          "wmic logicaldisk get size,freespace /format:csv",
          { timeout: 5000 }
        )
          .toString()
          .trim();
        const lines = output.split("\n").slice(1);
        let totalUsed = 0;
        let totalSize = 0;
        for (const line of lines) {
          const parts = line.trim().split(",");
          if (parts.length >= 3) {
            const free = parseInt(parts[1]) || 0;
            const size = parseInt(parts[2]) || 0;
            totalUsed += size - free;
            totalSize += size;
          }
        }
        disk = { used: totalUsed, total: totalSize };
      } else {
        const output = execSync("df -k / | tail -1", { timeout: 5000 })
          .toString()
          .trim();
        const parts = output.split(/\s+/);
        const total = parseInt(parts[1]) * 1024;
        const used = parseInt(parts[2]) * 1024;
        disk = { used, total };
      }
    } catch {
      disk = { used: 0, total: 0 };
    }
  } catch {
    // return defaults
  }

  return Response.json({ cpu, memory, disk, uptime });
}