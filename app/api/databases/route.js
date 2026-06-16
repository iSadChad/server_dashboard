export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { pool } from "../../../lib/db";

export async function GET() {
  try {
    const result = await pool.query(`
      SELECT
        d.datname AS name,
        r.rolname AS owner,
        'PostgreSQL' AS type,
        current_setting('server_version') AS version,
        'running' AS status,
        5432 AS port,
        pg_database_size(d.datname) AS size,
        pg_size_pretty(pg_database_size(d.datname)) AS pretty_size,
        pg_encoding_to_char(d.encoding) AS encoding
      FROM pg_database d
      JOIN pg_roles r ON r.oid = d.datdba
      WHERE d.datistemplate = false
      ORDER BY d.datname;
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