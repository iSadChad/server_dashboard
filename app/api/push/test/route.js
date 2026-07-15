export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import pg from "pg";
import webpush from "web-push";

const { Pool } = pg;
const globalForPushTest = globalThis;

function getPool() {
  if (!process.env.TASKS_DATABASE_URL) {
    throw new Error("TASKS_DATABASE_URL is not set");
  }

  if (!globalForPushTest.pushTestPool) {
    globalForPushTest.pushTestPool = new Pool({
      connectionString: process.env.TASKS_DATABASE_URL,
    });
  }

  return globalForPushTest.pushTestPool;
}

function configureWebPush() {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;

  if (!publicKey || !privateKey || !subject) {
    throw new Error("VAPID environment variables are missing");
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
}

export async function POST() {
  try {
    configureWebPush();

    const result = await getPool().query(`
      SELECT endpoint, p256dh, auth
      FROM push_subscriptions;
    `);

    if (result.rows.length === 0) {
      return Response.json(
        {
          status: "error",
          message: "No subscribed devices found",
        },
        { status: 404 }
      );
    }

    const payload = JSON.stringify({
      title: "Chad's Goon Cave",
      body: "Test notification received successfully.",
      url: "/tasks",
      tag: "test-notification",
    });

    let sent = 0;
    let failed = 0;

    for (const row of result.rows) {
      const subscription = {
        endpoint: row.endpoint,
        keys: {
          p256dh: row.p256dh,
          auth: row.auth,
        },
      };

      try {
        await webpush.sendNotification(subscription, payload, {
          TTL: 60,
          urgency: "high",
        });

        sent += 1;
      } catch (error) {
        failed += 1;

        console.error("Failed to send push notification:", error);

        if (error.statusCode === 404 || error.statusCode === 410) {
          await getPool().query(
            `
            DELETE FROM push_subscriptions
            WHERE endpoint = $1;
            `,
            [row.endpoint]
          );
        }
      }
    }

    return Response.json({
      status: sent > 0 ? "ok" : "error",
      message:
        sent > 0
          ? `Notification sent to ${sent} device(s)`
          : "Notification could not be sent",
      sent,
      failed,
    });
  } catch (error) {
    console.error("Failed to send test notification:", error);

    return Response.json(
      {
        status: "error",
        message: "Could not send test notification",
        details: error.message,
      },
      { status: 500 }
    );
  }
}