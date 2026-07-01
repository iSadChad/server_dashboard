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
        repository: null,
        snapshotCount: 0,
        latestSnapshot: null,
        updatedAt: null,
      });
    }

    const raw = readFileSync(STATUS_FILE, "utf8");
    const data = JSON.parse(raw);

    return Response.json({
      status: data.status || "warning",
      message: data.message || "No backup message",
      repository: data.repository || null,
      snapshotCount: data.snapshotCount ?? 0,
      latestSnapshot: data.latestSnapshot || null,
      updatedAt: data.updatedAt || null,
    });
  } catch (error) {
    console.error("Failed to read backup status:", error);

    return Response.json(
      {
        status: "error",
        message: "Could not read backup status",
        repository: null,
        snapshotCount: 0,
        latestSnapshot: null,
        updatedAt: null,
        details: error.message,
      },
      { status: 500 }
    );
  }
}