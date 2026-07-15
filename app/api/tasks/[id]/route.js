export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import pg from "pg";

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

function getId(value) {
  const id = Number(value);

  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }

  return id;
}

export async function PATCH(request, context) {
  try {
    const { id: rawId } = await context.params;
    const id = getId(rawId);

    if (!id) {
      return Response.json(
        {
          status: "error",
          message: "Invalid task id",
        },
        { status: 400 }
      );
    }

    const body = await request.json();

    const current = await getPool().query("SELECT * FROM tasks WHERE id = $1", [
      id,
    ]);

    if (current.rowCount === 0) {
      return Response.json(
        {
          status: "error",
          message: "Task not found",
        },
        { status: 404 }
      );
    }

    const oldTask = current.rows[0];

    const title =
      body.title !== undefined ? String(body.title).trim() : oldTask.title;
    const notes =
      body.notes !== undefined ? String(body.notes).trim() : oldTask.notes;
    const category =
      body.category !== undefined
        ? String(body.category).trim() || "General"
        : oldTask.category;
    const priority =
      body.priority !== undefined &&
      ["low", "normal", "high"].includes(body.priority)
        ? body.priority
        : oldTask.priority;

    const status =
      body.status !== undefined && ["todo", "done"].includes(body.status)
        ? body.status
        : oldTask.status;

      let dueAt = oldTask.due_at;
      let remindAt = oldTask.remind_at;

      if (body.dueAt !== undefined) {
        dueAt = body.dueAt ? new Date(String(body.dueAt)) : null;

        if (dueAt && Number.isNaN(dueAt.getTime())) {
          return Response.json(
            {
              status: "error",
              message: "Invalid due date and time",
            },
            { status: 400 }
          );
        }
      }

      if (body.remindAt !== undefined) {
        remindAt = body.remindAt
          ? new Date(String(body.remindAt))
          : null;

        if (remindAt && Number.isNaN(remindAt.getTime())) {
          return Response.json(
            {
              status: "error",
              message: "Invalid reminder date and time",
            },
            { status: 400 }
          );
        }
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

    if (!title) {
      return Response.json(
        {
          status: "error",
          message: "Task title is required",
        },
        { status: 400 }
      );
    }

    const completedAt =
      status === "done"
        ? oldTask.completed_at || new Date().toISOString()
        : null;

    const result = await getPool().query(
        `
        UPDATE tasks
        SET
          title = $1,
          notes = $2,
          category = $3,
          priority = $4,
          due_at = $5,
          remind_at = $6,
          status = $7,
          completed_at = $8,
          updated_at = NOW()
        WHERE id = $9
        RETURNING *;
        `,
        [
          title,
          notes,
          category,
          priority,
          dueAt,
          remindAt,
          status,
          completedAt,
          id,
        ]
      );

    return Response.json({
      status: "ok",
      task: normalizeTask(result.rows[0]),
    });
  } catch (error) {
    console.error("Failed to update task:", error);

    return Response.json(
      {
        status: "error",
        message: "Could not update task",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request, context) {
  try {
    const { id: rawId } = await context.params;
    const id = getId(rawId);

    if (!id) {
      return Response.json(
        {
          status: "error",
          message: "Invalid task id",
        },
        { status: 400 }
      );
    }

    const result = await getPool().query(
      "DELETE FROM tasks WHERE id = $1 RETURNING id",
      [id]
    );

    if (result.rowCount === 0) {
      return Response.json(
        {
          status: "error",
          message: "Task not found",
        },
        { status: 404 }
      );
    }

    return Response.json({
      status: "ok",
      deletedId: id,
    });
  } catch (error) {
    console.error("Failed to delete task:", error);

    return Response.json(
      {
        status: "error",
        message: "Could not delete task",
        details: error.message,
      },
      { status: 500 }
    );
  }
}