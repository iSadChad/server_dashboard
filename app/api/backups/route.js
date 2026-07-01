import { readFile } from "fs/promises";

const BACKUP_STATUS_FILE = "/home/tset/backup-status.json";

export async function GET() {
  try {
    const raw = await readFile(BACKUP_STATUS_FILE, "utf8");
    const data = JSON.parse(raw);

    return Response.json({
      ok: true,
      ...data,
    });
  } catch (error) {
    return Response.json(
      {
        ok: false,
        error: "Could not load backup status",
        repository: null,
        lastBackup: null,
        snapshots: 0,
        snapshotId: null,
      },
      { status: 500 }
    );
  }
}