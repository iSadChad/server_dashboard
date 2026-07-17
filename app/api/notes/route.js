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

export async function POST(request) {
    try {
        const body = await request.json();

        const title =
        typeof body.title === "string" ? body.title.trim() : "";
        const content =
        typeof body.content === "string" ? body.content.trim() : null;

        if (!title) {
            return Response.json(
                {
                    error: "Title are required",
                },
                { status: 400 }
            );
        }

        const result = await getPool().query(
            "INSERT INTO notes (title, content) VALUES ($1, $2) RETURNING *",
            [title, content]
        );
        return Response.json(result.rows[0], { status: 201 });
    } catch (error) {
        console.error("Failed to create note:", error);
        return Response.json(
            {
                error: "Failed to create note",
                details: error.message,
            },
            { status: 500 }
        );
    }
}
