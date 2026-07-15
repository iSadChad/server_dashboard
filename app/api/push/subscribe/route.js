export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import pg from "pg";

const { Pool } = pg;
const globalForPush = globalThis;

function getPool() {
  if (!process.env.TASKS_DATABASE_URL) {
    throw new Error("TASKS_DATABASE_URL is not set");
  }

  if (!globalForPush.pushSubscriptionPool) {
    globalForPush.pushSubscriptionPool = new Pool({
      connectionString: process.env.TASKS_DATABASE_URL,
    });
  }

  return globalForPush.pushSubscriptionPool;
}

let tableReadyPromise = null;

async function ensureSubscriptionTable() {
  if (!tableReadyPromise) {
    tableReadyPromise = getPool().query(`
      CREATE TABLE IF NOT EXISTS push_subscriptions (
        endpoint TEXT PRIMARY KEY,
        p256dh TEXT NOT NULL,
        auth TEXT NOT NULL,
        user_agent TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
  }

  await tableReadyPromise;
}

export async function POST(request) {
  try {
    await ensureSubscriptionTable();

    const body = await request.json();

    const endpoint = String(body.endpoint || "").trim();
    const p256dh = String(body.keys?.p256dh || "").trim();
    const auth = String(body.keys?.auth || "").trim();
    const userAgent = request.headers.get("user-agent") || null;

    if (!endpoint || !p256dh || !auth) {
      return Response.json(
        {
          status: "error",
          message: "Invalid push subscription",
        },
        { status: 400 }
      );
    }

    await getPool().query(
      `
      INSERT INTO push_subscriptions (
        endpoint,
        p256dh,
        auth,
        user_agent
      )
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (endpoint)
      DO UPDATE SET
        p256dh = EXCLUDED.p256dh,
        auth = EXCLUDED.auth,
        user_agent = EXCLUDED.user_agent,
        updated_at = NOW();
      `,
      [endpoint, p256dh, auth, userAgent]
    );

    return Response.json({
      status: "ok",
      message: "Push subscription saved",
    });
  } catch (error) {
    console.error("Failed to save push subscription:", error);

    return Response.json(
      {
        status: "error",
        message: "Could not save push subscription",
        details: error.message,
      },
      { status: 500 }
    );
  }
}