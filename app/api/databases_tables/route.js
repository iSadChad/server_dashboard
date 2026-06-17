export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import pg from "pg";

const { Pool } = pg;

function getConnectionStringForDatabase(databaseName) {
  if (!databaseName || !/^[a-zA-Z0-9_]+$/.test(databaseName)) {
    throw new Error("Invalid database name");
  }

  const url = new URL(process.env.DATABASE_URL);
  url.pathname = `/${databaseName}`;

  return url.toString();
}

export async function GET(request) {
  let pool;

  try {
    const url = new URL(request.url);
    const databaseName = url.searchParams.get("db");

    if (!databaseName) {
      return Response.json(
        { error: "Missing database name" },
        { status: 400 }
      );
    }

    pool = new Pool({
      connectionString: getConnectionStringForDatabase(databaseName),
    });

    const result = await pool.query(`
      SELECT
        table_schema,
        table_name,
        table_type
      FROM information_schema.tables
      WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
      ORDER BY table_schema, table_name;
    `);

    return Response.json({
      database: databaseName,
      tables: result.rows,
    });
  } catch (error) {
    console.error("Failed to fetch database tables:", error);

    return Response.json(
      { error: "Failed to fetch database tables" },
      { status: 500 }
    );
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}