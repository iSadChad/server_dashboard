const test = require("node:test");
const assert = require("node:assert/strict");
const { PGlite } = require("@electric-sql/pglite");
const { pathToFileURL } = require("node:url");
const path = require("node:path");

const future = () => new Date(Date.now() + 86400000).toISOString();
const body = (extra = {}) => ({ title: "  Reminder  ", kind: "once", startsAt: future(), timeZone: "UTC", ...extra });

let db;
test.before(async () => { db = new PGlite(); await db.waitReady; });
test.after(async () => { await db.close(); });

test("real PostgreSQL store persists normalized CRUD and ISO timestamps", async () => {
  const { createScheduleStore, ensureSchema } = require("../lib/schedule-store.cjs");
  await Promise.all([ensureSchema(db), ensureSchema(db)]);
  const store = createScheduleStore(db);
  assert.deepEqual(await store.list(), []);
  const entry = await store.create(body());
  assert.equal(entry.title, "Reminder");
  assert.equal(typeof entry.id, "number");
  assert.equal(entry.nextRunAt, entry.startsAt);
  assert.equal(entry.lastRunAt, null);
  for (const key of ["createdAt", "updatedAt", "nextRunAt"]) assert.equal(new Date(entry[key]).toISOString(), entry[key]);
  const persisted = (await db.query("SELECT definition FROM schedule_entries WHERE id = $1", [entry.id])).rows[0].definition;
  assert.equal(persisted.enabled, true);
  assert.equal(persisted.notifications, true);
  assert.deepEqual(await store.list(), [entry]);
  const updated = await store.update(entry.id, { title: "Changed", notes: "Keep me", notifications: false });
  assert.equal(updated.title, "Changed");
  assert.equal(updated.notes, "Keep me");
  assert.equal(updated.notifications, false);
  assert.equal(updated.nextRunAt, entry.nextRunAt);
  assert.equal(updated.createdAt, entry.createdAt);
  assert.ok(updated.updatedAt >= entry.updatedAt);
  await store.remove(entry.id);
  assert.deepEqual(await store.list(), []);
});

const errorStatus = (status) => (error) => error.status === status && typeof error.message === "string";

test("store rejects invalid input, unknown fields, unsafe identifiers and missing rows", async () => {
  const { createScheduleStore } = require("../lib/schedule-store.cjs");
  const store = createScheduleStore(db);
  for (const input of [null, [], body({ title: "" }), body({ secret: 1 }), body({ enabled: "false" }), body({ startsAt: "2000-01-01T00:00:00Z" }), body({ kind: "weekly", weekdays: [] }), body({ kind: "interval", intervalMinutes: 1440, activeStart: "01:00", activeEnd: "01:01", startsAt: "2099-01-01T02:00:00Z" })]) {
    await assert.rejects(store.create(input), errorStatus(400));
  }
  for (const id of ["1e2", "1.0", "-1", "0", " 1", "9007199254740992", "abc", null]) {
    await assert.rejects(store.update(id, { title: "No" }), errorStatus(400));
    await assert.rejects(store.remove(id), errorStatus(400));
  }
  await assert.rejects(store.update(999999, { title: "No" }), errorStatus(404));
  await assert.rejects(store.remove(999999), errorStatus(404));
  const entry = await store.create(body());
  await assert.rejects(store.update(entry.id, { id: entry.id }), errorStatus(400));
  await assert.rejects(store.update(entry.id, null), errorStatus(400));
  await store.remove(entry.id);
});

test("pause/resume recomputes recurrence but metadata edits preserve worker progress", async () => {
  const { createScheduleStore } = require("../lib/schedule-store.cjs");
  const store = createScheduleStore(db);
  const entry = await store.create(body({ kind: "interval", intervalMinutes: 5 }));
  assert.equal((await store.update(entry.id, { enabled: false })).nextRunAt, null);
  const past = "2000-01-01T00:00:00.000Z";
  const paused = await store.update(entry.id, { startsAt: past });
  assert.equal(paused.nextRunAt, null);
  const resumed = await store.update(entry.id, { enabled: true });
  assert.ok(Date.parse(resumed.nextRunAt) > Date.now());
  const moved = await store.update(entry.id, { startsAt: future(), intervalMinutes: 10 });
  assert.equal(moved.nextRunAt, moved.startsAt);
  await db.query("UPDATE schedule_entries SET next_run_at = NULL, last_run_at = NOW() WHERE id = $1", [entry.id]);
  const edited = await store.update(entry.id, { notes: "Only metadata", notifications: false });
  assert.equal(edited.nextRunAt, null);
  assert.ok(edited.lastRunAt);
  await store.remove(entry.id);

  const once = await store.create(body());
  await db.query("UPDATE schedule_entries SET definition = jsonb_set(definition, '{startsAt}', $2::jsonb), next_run_at = NULL, last_run_at = NOW() WHERE id = $1", [once.id, JSON.stringify(past)]);
  assert.equal((await store.update(once.id, { title: "Completed" })).nextRunAt, null);
  await store.update(once.id, { enabled: false });
  await assert.rejects(store.update(once.id, { enabled: true }), errorStatus(400));
  await store.remove(once.id);
});

test("optimistic update rejects a worker change instead of overwriting its progress", async () => {
  const { createScheduleStore } = require("../lib/schedule-store.cjs");
  const store = createScheduleStore(db);
  const entry = await store.create(body());
  let interleaved = false;
  const racingDb = { async query(sql, params) {
    const result = await db.query(sql, params);
    if (!interleaved && /SELECT[\s\S]*FROM schedule_entries WHERE id/.test(sql)) {
      interleaved = true;
      await db.query("UPDATE schedule_entries SET last_run_at = NOW(), next_run_at = NULL, updated_at = clock_timestamp() WHERE id = $1", [entry.id]);
    }
    return result;
  } };
  await assert.rejects(createScheduleStore(racingDb).update(entry.id, { notes: "stale" }), errorStatus(409));
  const actual = (await store.list()).find((row) => row.id === entry.id);
  assert.equal(actual.notes, "");
  assert.equal(actual.nextRunAt, null);
  assert.ok(actual.lastRunAt);
  await store.remove(entry.id);
});

test("metadata updates preserve PostgreSQL microsecond worker timestamps", async () => {
  const { createScheduleStore } = require("../lib/schedule-store.cjs");
  const store = createScheduleStore(db);
  const entry = await store.create(body());
  await db.query("UPDATE schedule_entries SET last_run_at = '2026-01-01T00:00:00.123456Z', next_run_at = '2099-01-01T00:00:00.654321Z' WHERE id = $1", [entry.id]);
  await store.update(entry.id, { notes: "Metadata" });
  const row = (await db.query("SELECT last_run_at::text AS last, next_run_at::text AS next FROM schedule_entries WHERE id = $1", [entry.id])).rows[0];
  assert.match(row.last, /123456/);
  assert.match(row.next, /654321/);
  await store.remove(entry.id);
});

test("schema initialization shares in-flight work and retries after rejection", async () => {
  const { ensureSchema } = require("../lib/schedule-store.cjs");
  let attempts = 0;
  const adapter = { async query(sql, params) {
    attempts += 1;
    if (attempts === 1) throw new Error("Transient startup error");
    return db.query(sql, params);
  } };
  await assert.rejects(Promise.all([ensureSchema(adapter), ensureSchema(adapter)]), /Transient/);
  assert.equal(attempts, 1);
  await Promise.all([ensureSchema(adapter), ensureSchema(adapter)]);
  assert.equal(attempts, 2);
});

test("Next route handlers execute CRUD against real PGlite and sanitize failures", async () => {
  const collection = await import(pathToFileURL(path.resolve(__dirname, "../app/api/schedule/route.js")).href);
  const item = await import(pathToFileURL(path.resolve(__dirname, "../app/api/schedule/[id]/route.js")).href);
  for (const route of [collection, item]) {
    assert.equal(route.runtime, "nodejs");
    assert.equal(route.dynamic, "force-dynamic");
  }
  const originalPool = globalThis.tasksPool;
  const originalUrl = process.env.TASKS_DATABASE_URL;
  globalThis.tasksPool = db;
  process.env.TASKS_DATABASE_URL = "postgres://unused-test-placeholder";
  const req = (method, input) => new Request("http://localhost/api/schedule", { method, body: JSON.stringify(input), headers: { "content-type": "application/json" } });
  const ctx = (id) => ({ params: Promise.resolve({ id: String(id) }) });
  try {
    let response = await collection.POST(req("POST", body()));
    assert.equal(response.status, 201);
    const { entry } = await response.json();
    response = await collection.GET();
    assert.equal(response.status, 200);
    assert.ok((await response.json()).entries.some((row) => row.id === entry.id));
    response = await item.PATCH(req("PATCH", { enabled: false }), ctx(entry.id));
    assert.equal(response.status, 200);
    assert.equal((await response.json()).entry.nextRunAt, null);
    response = await item.DELETE(req("DELETE", {}), ctx(entry.id));
    assert.equal(response.status, 200);
    assert.deepEqual(await response.json(), { status: "ok" });
    assert.equal((await db.query("SELECT * FROM schedule_entries WHERE id = $1", [entry.id])).rows.length, 0);
    assert.equal((await item.DELETE(req("DELETE", {}), ctx(entry.id))).status, 404);
    assert.equal((await item.PATCH(req("PATCH", {}), ctx(entry.id))).status, 404);
    assert.equal((await item.DELETE(req("DELETE", {}), ctx("1e2"))).status, 400);
    assert.equal((await item.PATCH(req("PATCH", {}), ctx("9007199254740992"))).status, 400);
    for (const input of [body({ extra: true }), null, []]) assert.equal((await collection.POST(req("POST", input))).status, 400);
    const malformed = () => new Request("http://localhost/api/schedule", { method: "POST", body: "{" });
    assert.equal((await collection.POST(malformed())).status, 400);
    assert.equal((await item.PATCH(malformed(), ctx(1))).status, 400);
    globalThis.tasksPool = { async query() { throw new Error("private password database diagnostic"); } };
    response = await collection.GET();
    assert.equal(response.status, 500);
    const error = await response.json();
    assert.equal(typeof error.message, "string");
    assert.equal(JSON.stringify(error).includes("private"), false);
    assert.equal("details" in error, false);
    globalThis.tasksPool = db;
    assert.equal((await collection.GET()).status, 200);
  } finally {
    if (originalPool === undefined) delete globalThis.tasksPool;
    else globalThis.tasksPool = originalPool;
    if (originalUrl === undefined) delete process.env.TASKS_DATABASE_URL;
    else process.env.TASKS_DATABASE_URL = originalUrl;
  }
});
