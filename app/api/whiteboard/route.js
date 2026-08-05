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

export async function PATCH(request) {
  try {
    const body = await request.json();
    const drawingData = body.drawingData;

    if (drawingData === undefined) {
      return Response.json(
        {
          status: "error",
          message: "Missing drawingData in request body",
        },
        { status: 400 }
      );
    }

    const result = await getPool().query(
      `
      UPDATE public.whiteboard_state
      SET
        drawing_data = $1,
        updated_at = NOW()
      WHERE id = 1
      RETURNING
        drawing_data AS "drawingData",
        updated_at AS "updatedAt";
      `,
      [drawingData]
    );

    if (result.rowCount === 0) {
      return Response.json(
        {
          status: "error",
          message: "Whiteboard state not found",
        },
        { status: 404 }
      );
    }

    return Response.json(result.rows[0]);
  } catch (error) {
    console.error("Failed to update whiteboard:", error);
    return Response.json(
      {
        status: "error",
        message: "Could not update whiteboard",
        details: error.message,
      },
      { status: 500 }
    );
  }
}