export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { pool } from "../../../lib/db";

export async function GET() {
  try {
    const result = await pool.query(`
      SELECT
        datname AS name,
        'PostgreSQL' AS type,
        current_setting('server_version') AS version,
        'running' AS status,
        5432 AS port,
        pg_database_size(datname) AS size
      FROM pg_database
      WHERE datistemplate = false
      ORDER BY datname;
    `);

    return Response.json(result.rows);
  } catch (error) {
    console.error("Failed to fetch databases:", error);

    return Response.json(
      { error: "Failed to fetch databases" },
      { status: 500 }
    );
  }
}