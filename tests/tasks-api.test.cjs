const test = require("node:test");
const assert = require("node:assert/strict");
const { PGlite } = require("@electric-sql/pglite");
const { pathToFileURL } = require("node:url");
const path = require("node:path");
const { ensureTasksTable } = require("../lib/tasks-schema.cjs");

const request = (method, body) => new Request("http://localhost/api/tasks", {
  method,
  headers: { "content-type": "application/json" },
  body: JSON.stringify(body),
});
const context = (id) => ({ params: Promise.resolve({ id: String(id) }) });

test("task schema initialization retries a transient failure and shares concurrent work", async () => {
  const db = new PGlite();
  let attempts = 0;
  const adapter = { async query(sql, params) {
    attempts += 1;
    if (attempts === 1) throw new Error("Transient startup error");
    return db.query(sql, params);
  } };
  try {
    await assert.rejects(ensureTasksTable(adapter), /Transient startup/);
    await Promise.all([ensureTasksTable(adapter), ensureTasksTable(adapter)]);
    assert.equal(attempts, 3);
    const columns = (await db.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'tasks'")).rows.map((row) => row.column_name);
    for (const name of ["due_at", "remind_at", "reminder_sent_at"]) assert.ok(columns.includes(name));
  } finally {
    await db.close();
  }
});

// pg and PGlite use different affected-row property names.
function queryAdapter(db) {
  return { async query(sql, params) {
    const result = await db.query(sql, params);
    return { ...result, rowCount: result.rows.length || result.affectedRows || 0 };
  } };
}

async function withRoutes(run) {
  const db = new PGlite();
  const originalPool = globalThis.tasksPool;
  const originalUrl = process.env.TASKS_DATABASE_URL;
  globalThis.tasksPool = queryAdapter(db);
  process.env.TASKS_DATABASE_URL = "postgres://unused-test-placeholder";
  try {
    const collection = await import(pathToFileURL(path.resolve(__dirname, "../app/api/tasks/route.js")).href);
    const item = await import(pathToFileURL(path.resolve(__dirname, "../app/api/tasks/[id]/route.js")).href);
    await run({ db, collection, item });
  } finally {
    if (originalPool === undefined) delete globalThis.tasksPool;
    else globalThis.tasksPool = originalPool;
    if (originalUrl === undefined) delete process.env.TASKS_DATABASE_URL;
    else process.env.TASKS_DATABASE_URL = originalUrl;
    await db.close();
  }
}

test("task routes create, list, edit and delete reminders on a fresh database", async () => {
  await withRoutes(async ({ db, collection, item }) => {
    const dueAt = "2099-06-01T12:00:00.000Z";
    const remindAt = "2099-06-01T11:00:00.000Z";
    let response = await collection.POST(request("POST", { title: "Fresh task", dueAt, remindAt }));
    const created = await response.json();
    assert.equal(response.status, 201, JSON.stringify(created));
    assert.equal(created.task.dueAt, dueAt);
    assert.equal(created.task.remindAt, remindAt);
    const id = created.task.id;

    response = await collection.GET();
    assert.equal(response.status, 200);
    assert.equal((await response.json()).tasks[0].id, id);

    response = await item.PATCH(request("PATCH", { status: "done" }), context(id));
    assert.equal(response.status, 200);
    assert.equal((await response.json()).task.status, "done");
    assert.equal((await db.query("SELECT due_at, remind_at FROM tasks WHERE id = $1", [id])).rows.length, 1);

    response = await item.DELETE(request("DELETE", {}), context(id));
    assert.equal(response.status, 200);
    assert.equal((await db.query("SELECT * FROM tasks")).rows.length, 0);
  });
});

test("editing an existing task upgrades the legacy schema without losing data", async () => {
  await withRoutes(async ({ db, collection, item }) => {
    await db.exec(`CREATE TABLE tasks (
      id BIGSERIAL PRIMARY KEY, title TEXT NOT NULL, notes TEXT DEFAULT '',
      category TEXT DEFAULT 'General', priority TEXT DEFAULT 'normal', due_date DATE,
      status TEXT DEFAULT 'todo', created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW(), completed_at TIMESTAMPTZ
    ); INSERT INTO tasks (title, due_date) VALUES ('Legacy task', '2099-06-01');`);
    const response = await item.PATCH(request("PATCH", { notes: "Preserved" }), context(1));
    const data = await response.json();
    assert.equal(response.status, 200, JSON.stringify(data));
    assert.equal(data.task.title, "Legacy task");
    assert.equal((await db.query("SELECT due_date::text AS day, reminder_sent_at FROM tasks")).rows[0].day, "2099-06-01");
    assert.equal((await collection.GET()).status, 200);
  });
});

test("task list orders current due timestamps instead of the legacy date field", async () => {
  await withRoutes(async ({ collection }) => {
    for (const [title, dueAt] of [["Later", "2099-06-02T12:00:00Z"], ["Earlier", "2099-06-01T12:00:00Z"], ["Undated", null]]) {
      assert.equal((await collection.POST(request("POST", { title, dueAt }))).status, 201);
    }
    const response = await collection.GET();
    assert.deepEqual((await response.json()).tasks.map((task) => task.title), ["Earlier", "Later", "Undated"]);
  });
});
