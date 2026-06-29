export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { existsSync, readFileSync } from "fs";

const STATUS_FILE = "/var/backups/chadsgooncave/backup-status.json";

export async function GET() {
  try {
    if (!existsSync(STATUS_FILE)) {
      return Response.json({
        status: "warning",
        message: "No backup status file found yet",
        snapshotCount: 0,
        latestSnapshot: null,
        updatedAt: null,
      });
    }

    const raw = readFileSync(STATUS_FILE, "utf8");
    const data = JSON.parse(raw);

    return Response.json(data);
  } catch (error) {
    return Response.json(
      {
        status: "error",
        message: "Could not read backup status",
        details: error.message,
      },
      { status: 500 }
    );
  }
}