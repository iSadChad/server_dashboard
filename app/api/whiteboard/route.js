export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import pg from "pg";

const { Pool } = pg;

const globalForWhiteboard = globalThis;

function getPool() {
  const connectionString = process.env.NOTES_DATABASE_URL;

  if (!connectionString) {
    throw new Error("NOTES_DATABASE_URL or DATABASE_URL is not set");
  }

  if (!globalForWhiteboard.whiteboardPool) {
    globalForWhiteboard.whiteboardPool = new Pool({
      connectionString,
    });
  }

  return globalForWhiteboard.whiteboardPool;
}


export async function GET() {
  try {
    const result = await getPool().query(`
    SELECT drawing_data AS "drawingData"
    FROM whiteboard_state
    WHERE id = 1;
    `);

    return Response.json(
    result.rows[0] || { drawingData: null });
    } catch (error) {
    console.error("Failed to fetch whiteboard:", error);

    return Response.json(
      {
        status: "error",
        message: "Could not fetch whiteboard",
        details: error.message,
      },
      { status: 500 }
    );
  }
}