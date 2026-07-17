export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import pg from "pg";

const { Pool } = pg;

const globalForNotes = globalThis;

function getPool() {
  const connectionString =
    process.env.NOTES_DATABASE_URL || process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error("NOTES_DATABASE_URL or DATABASE_URL is not set");
  }

  if (!globalForNotes.notesPool) {
    globalForNotes.notesPool = new Pool({
      connectionString,
    });
  }

  return globalForNotes.notesPool;
}


export async function GET() {
  try {

    const result = await getPool().query(`
      SELECT *
      FROM notes
      ORDER BY updated_at DESC;
    `);

    return Response.json(result.rows);
  } catch (error) {
    return Response.json(   
  {
    error: "Failed to fetch notes",
    details: error.message,
  },
  { status: 500 }
);
  }
}

