export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import pg from "pg";

const { Pool } = pg;

function validateIdentifier(value, label) {
  if (!value || !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(value)) {
    throw new Error(`Invalid ${label}`);
  }

  return value;
}

function quoteIdentifier(value) {
  return `"${value.replaceAll('"', '""')}"`;
}

function getConnectionStringForDatabase(databaseName) {
  validateIdentifier(databaseName, "database name");

  const url = new URL(process.env.DATABASE_URL);
  url.pathname = `/${databaseName}`;

  return url.toString();
}

export async function GET(request) {
  let pool;

  try {
    const url = new URL(request.url);

    const databaseName = url.searchParams.get("db");
    const schemaName = url.searchParams.get("schema") || "public";
    const tableName = url.searchParams.get("table");

    const limit = Math.min(Number(url.searchParams.get("limit")) || 50, 100);
    const offset = Number(url.searchParams.get("offset")) || 0;

    validateIdentifier(databaseName, "database name");
    validateIdentifier(schemaName, "schema name");
    validateIdentifier(tableName, "table name");

    pool = new Pool({
      connectionString: getConnectionStringForDatabase(databaseName),
    });

    const fullTableName = `${quoteIdentifier(schemaName)}.${quoteIdentifier(tableName)}`;

    const result = await pool.query(
      `SELECT * FROM ${fullTableName} LIMIT $1 OFFSET $2;`,
      [limit, offset]
    );

    return Response.json({
      database: databaseName,
      schema: schemaName,
      table: tableName,
      limit,
      offset,
      rows: result.rows,
      columns: result.fields.map((field) => field.name),
    });
  } catch (error) {
    console.error("Failed to fetch rows:", error);

    return Response.json(
      { error: "Failed to fetch rows" },
      { status: 500 }
    );
  } finally {
    if (pool) {
      await pool.end();
    }
  }
}