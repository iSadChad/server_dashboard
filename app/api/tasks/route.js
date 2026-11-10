export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import pg from "pg";
import { ensureTasksTable } from "../../../lib/tasks-schema.cjs";

const { Pool } = pg;

const globalForTasks = globalThis;

function getPool() {
  if (!process.env.TASKS_DATABASE_URL) {
    throw new Error("TASKS_DATABASE_URL is not set");
  }

  if (!globalForTasks.tasksPool) {
    globalForTasks.tasksPool = new Pool({
      connectionString: process.env.TASKS_DATABASE_URL,
    });
  }

  return globalForTasks.tasksPool;
}


function normalizeTask(row) {
  return {
    id: Number(row.id),
    title: row.title,
    notes: row.notes || "",
    category: row.category || "General",
    priority: row.priority || "normal",
    dueAt: row.due_at ? new Date(row.due_at).toISOString() : "",
    remindAt: row.remind_at ? new Date(row.remind_at).toISOString() : "",
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    completedAt: row.completed_at,
  };
}

export async function GET() {
  try {
    await ensureTasksTable(getPool());

    const result = await getPool().query(`
      SELECT *
      FROM tasks
      ORDER BY
        CASE WHEN status = 'todo' THEN 0 ELSE 1 END,
        CASE WHEN due_at IS NULL THEN 1 ELSE 0 END,
        due_at ASC,
        created_at DESC;
    `);

    return Response.json({
      status: "ok",
      tasks: result.rows.map(normalizeTask),
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Failed to load tasks:", error);

    return Response.json(
      {
        status: "error",
        message: "Could not load tasks",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    await ensureTasksTable(getPool());

    const body = await request.json();

    const title = String(body.title || "").trim();
    const notes = String(body.notes || "").trim();
    const category = String(body.category || "General").trim() || "General";
    const priority = ["low", "normal", "high"].includes(body.priority)
      ? body.priority
      : "normal";
    const dueAt = body.dueAt ? new Date(String(body.dueAt)) : null;
    const remindAt = body.remindAt
      ? new Date(String(body.remindAt))
      : null;

    if (dueAt && Number.isNaN(dueAt.getTime())) {
      return Response.json(
        {
          status: "error",
          message: "Invalid due date and time",
        },
        { status: 400 }
      );
    }

    if (remindAt && Number.isNaN(remindAt.getTime())) {
      return Response.json(
        {
          status: "error",
          message: "Invalid reminder date and time",
        },
        { status: 400 }
      );
    }

    if (remindAt && !dueAt) {
      return Response.json(
        {
          status: "error",
          message: "A due date is required when using a reminder",
        },
        { status: 400 }
      );
    }

if (dueAt && remindAt && remindAt > dueAt) {
  return Response.json(
    {
      status: "error",
      message: "The reminder cannot be after the due date",
    },
    { status: 400 }
  );
}

    const result = await getPool().query(
    `
    INSERT INTO tasks (
      title,
      notes,
      category,
      priority,
      due_at,
      remind_at
    )
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING *;
    `,
    [title, notes, category, priority, dueAt, remindAt]
  );

    return Response.json(
      {
        status: "ok",
        task: normalizeTask(result.rows[0]),
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Failed to create task:", error);

    return Response.json(
      {
        status: "error",
        message: "Could not create task",
        details: error.message,
      },
      { status: 500 }
    );
  }
}