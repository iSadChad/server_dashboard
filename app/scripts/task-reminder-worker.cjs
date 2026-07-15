const { loadEnvConfig } = require("@next/env");
const pg = require("pg");
const webpush = require("web-push");

loadEnvConfig(process.cwd());

const { Pool } = pg;

const CHECK_INTERVAL_MS = 60_000;
const MAX_TASKS_PER_RUN = 25;
const ADVISORY_LOCK_ID = 3847001;
const TIME_ZONE = process.env.TASK_TIME_ZONE || "Europe/Zurich";

let shuttingDown = false;
let scanRunning = false;

function log(message, details = null) {
  const timestamp = new Date().toISOString();

  if (details) {
    console.log(`[${timestamp}] ${message}`, details);
  } else {
    console.log(`[${timestamp}] ${message}`);
  }
}

function validateEnvironment() {
  const requiredVariables = [
    "TASKS_DATABASE_URL",
    "NEXT_PUBLIC_VAPID_PUBLIC_KEY",
    "VAPID_PRIVATE_KEY",
    "VAPID_SUBJECT",
  ];

  const missing = requiredVariables.filter(
    (variable) => !process.env[variable]
  );

  if (missing.length > 0) {
    throw new Error(
      `Missing environment variables: ${missing.join(", ")}`
    );
  }
}

validateEnvironment();

webpush.setVapidDetails(
  process.env.VAPID_SUBJECT,
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

const pool = new Pool({
  connectionString: process.env.TASKS_DATABASE_URL,
});

function formatDueDate(value) {
  if (!value) {
    return null;
  }

  try {
    return new Intl.DateTimeFormat("en-GB", {
      timeZone: TIME_ZONE,
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value));
  } catch {
    return null;
  }
}

async function ensureDatabaseStructure() {
  await pool.query(`
    ALTER TABLE tasks
    ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMPTZ NULL;
  `);

  await pool.query(`
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

async function removeExpiredSubscription(endpoint) {
  await pool.query(
    `
    DELETE FROM push_subscriptions
    WHERE endpoint = $1;
    `,
    [endpoint]
  );

  log("Removed expired push subscription.");
}

async function sendPush(subscriptionRow, payload) {
  const subscription = {
    endpoint: subscriptionRow.endpoint,
    keys: {
      p256dh: subscriptionRow.p256dh,
      auth: subscriptionRow.auth,
    },
  };

  try {
    await webpush.sendNotification(
      subscription,
      JSON.stringify(payload),
      {
        TTL: 300,
        urgency: "high",
      }
    );

    return true;
  } catch (error) {
    const statusCode = error.statusCode || error.status;

    if (statusCode === 404 || statusCode === 410) {
      await removeExpiredSubscription(subscriptionRow.endpoint);
    } else {
      console.error(
        `[${new Date().toISOString()}] Push notification failed:`,
        error
      );
    }

    return false;
  }
}

async function processTask(task, subscriptions) {
  const formattedDueDate = formatDueDate(task.due_at);

  const payload = {
    title: "Task Reminder",
    body: formattedDueDate
      ? `${task.title} · Due ${formattedDueDate}`
      : task.title,
    url: "/tasks",
    tag: `task-reminder-${task.id}`,
  };

  let successfulSends = 0;

  for (const subscription of subscriptions) {
    const sent = await sendPush(subscription, payload);

    if (sent) {
      successfulSends += 1;
    }
  }

  if (successfulSends === 0) {
    log(
      `Reminder for task ${task.id} was not delivered. It will be retried.`
    );

    return false;
  }

  await pool.query(
    `
    UPDATE tasks
    SET
      reminder_sent_at = NOW(),
      updated_at = NOW()
    WHERE id = $1
      AND reminder_sent_at IS NULL;
    `,
    [task.id]
  );

  log(
    `Sent reminder for task ${task.id} to ${successfulSends} device(s): ${task.title}`
  );

  return true;
}

async function scanForReminders() {
  if (scanRunning || shuttingDown) {
    return;
  }

  scanRunning = true;

  const client = await pool.connect();
  let lockAcquired = false;

  try {
    const lockResult = await client.query(
      `
      SELECT pg_try_advisory_lock($1) AS acquired;
      `,
      [ADVISORY_LOCK_ID]
    );

    lockAcquired = lockResult.rows[0]?.acquired === true;

    if (!lockAcquired) {
      log("Another reminder worker is already processing tasks.");
      return;
    }

    const subscriptionsResult = await client.query(`
      SELECT endpoint, p256dh, auth
      FROM push_subscriptions;
    `);

    if (subscriptionsResult.rows.length === 0) {
      log("No subscribed devices found.");
      return;
    }

    const tasksResult = await client.query(
      `
      SELECT
        id,
        title,
        notes,
        due_at,
        remind_at
      FROM tasks
      WHERE status = 'todo'
        AND remind_at IS NOT NULL
        AND remind_at <= NOW()
        AND reminder_sent_at IS NULL
      ORDER BY remind_at ASC
      LIMIT $1;
      `,
      [MAX_TASKS_PER_RUN]
    );

    if (tasksResult.rows.length === 0) {
      return;
    }

    log(`Found ${tasksResult.rows.length} due task reminder(s).`);

    for (const task of tasksResult.rows) {
      await processTask(task, subscriptionsResult.rows);
    }
  } catch (error) {
    console.error(
      `[${new Date().toISOString()}] Reminder scan failed:`,
      error
    );
  } finally {
    if (lockAcquired) {
      try {
        await client.query(
          `
          SELECT pg_advisory_unlock($1);
          `,
          [ADVISORY_LOCK_ID]
        );
      } catch (error) {
        console.error("Could not release reminder-worker lock:", error);
      }
    }

    client.release();
    scanRunning = false;
  }
}

async function shutDown(signal) {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;
  log(`Received ${signal}. Shutting down reminder worker.`);

  try {
    await pool.end();
  } catch (error) {
    console.error("Could not close PostgreSQL pool:", error);
  }

  process.exit(0);
}

async function start() {
  log("Starting task reminder worker.");

  await ensureDatabaseStructure();

  log(`Checking reminders every ${CHECK_INTERVAL_MS / 1000} seconds.`);

  await scanForReminders();

  if (process.argv.includes("--once")) {
    log("One-time scan finished.");
    await pool.end();
    return;
  }

  setInterval(() => {
    scanForReminders().catch((error) => {
      console.error("Unexpected reminder-worker error:", error);
    });
  }, CHECK_INTERVAL_MS);
}

process.on("SIGINT", () => shutDown("SIGINT"));
process.on("SIGTERM", () => shutDown("SIGTERM"));

process.on("unhandledRejection", (error) => {
  console.error("Unhandled promise rejection:", error);
});

process.on("uncaughtException", (error) => {
  console.error("Uncaught exception:", error);
  shutDown("uncaughtException");
});

start().catch(async (error) => {
  console.error("Could not start task reminder worker:", error);

  try {
    await pool.end();
  } finally {
    process.exit(1);
  }
});