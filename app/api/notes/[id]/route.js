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

function getId(value) {
    const id = Number(value);   

    if (!Number.isInteger(id) || id <= 0) {
        return null;
    }
    return id;
}

export async function DELETE(_request, context) {
  try {
    const { id: rawId } = await context.params;
    const id = getId(rawId);

    if (!id) {
      return Response.json(
        {
          status: "error",
          message: "Invalid note id",
        },
        { status: 400 }
      );
    }

    const result = await getPool().query(
      "DELETE FROM notes WHERE id = $1 RETURNING id",
      [id]
    );

    if (result.rowCount === 0) {
      return Response.json(
        {
          status: "error",
          message: "Note not found",
        },
        { status: 404 }
      );
    }

    return Response.json({
      status: "ok",
      deletedId: id,
    });
  } catch (error) {
    console.error("Failed to delete note:", error);

    return Response.json(
      {
        status: "error",
        message: "Could not delete note",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
