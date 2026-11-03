const test = require("node:test");
const assert = require("node:assert/strict");
const { PGlite } = require("@electric-sql/pglite");

test("worker sends due reminders, advances recurring entries, and finishes once entries", async () => {
  const { scanScheduleReminders } = require("../lib/schedule-worker.cjs");
  const db = new PGlite();
  try {
    await db.exec(`CREATE TABLE schedule_entries (id BIGSERIAL PRIMARY KEY, definition JSONB NOT NULL, next_run_at TIMESTAMPTZ, last_run_at TIMESTAMPTZ, updated_at TIMESTAMPTZ DEFAULT NOW());
      CREATE TABLE push_subscriptions (endpoint TEXT, p256dh TEXT, auth TEXT);
      INSERT INTO push_subscriptions VALUES ('test-device', 'public', 'auth');`);
    const base = { title: "Break", kind: "interval", startsAt: "2026-11-02T08:00Z", intervalMinutes: 60, timeZone: "Europe/Zurich", weekdays: [], enabled: true, notifications: true };
    for (const entry of [base, { ...base, kind: "once" }, { ...base, notifications: false }, { ...base, enabled: false }]) {
      await db.query("INSERT INTO schedule_entries (definition,next_run_at) VALUES ($1,$2)", [entry, "2026-11-02T10:00Z"]);
    }
    const sent = [];
    const pool = { connect: async () => ({ query: db.query.bind(db), release() {} }) };
    await scanScheduleReminders(pool, async (sub, payload) => { sent.push({ sub, payload }); return true; }, new Date("2026-11-02T10:00:30Z"));
    assert.equal(sent.length, 2);
    assert.equal(sent[0].payload.url, "/schedule");
    const { rows } = await db.query("SELECT * FROM schedule_entries ORDER BY id");
    assert.equal(rows[0].next_run_at.toISOString(), "2026-11-02T11:00:00.000Z");
    assert.equal(rows[1].next_run_at, null);
    assert.equal(rows[2].next_run_at.toISOString(), "2026-11-02T11:00:00.000Z");
    assert.equal(rows[3].last_run_at, null);
    await scanScheduleReminders(pool, async () => { throw new Error("Duplicate notification"); }, new Date("2026-11-02T10:01Z"));
  } finally { await db.close(); }
});

test("failed delivery retries, while stale recurring reminders skip catch-up spam", async () => {
  const { scanScheduleReminders } = require("../lib/schedule-worker.cjs");
  const db = new PGlite();
  try {
    await db.exec(`CREATE TABLE schedule_entries (id BIGSERIAL PRIMARY KEY, definition JSONB NOT NULL, next_run_at TIMESTAMPTZ, last_run_at TIMESTAMPTZ, updated_at TIMESTAMPTZ DEFAULT NOW());
      CREATE TABLE push_subscriptions (endpoint TEXT, p256dh TEXT, auth TEXT);
      INSERT INTO push_subscriptions VALUES ('device','public','auth');`);
    const entry = { title: "Break", kind: "interval", startsAt: "2026-11-02T08:00Z", intervalMinutes: 60, timeZone: "UTC", enabled: true, notifications: true };
    await db.query("INSERT INTO schedule_entries (definition,next_run_at) VALUES ($1,$2)", [entry, "2026-11-02T10:00Z"]);
    const pool = { connect: async () => ({ query: db.query.bind(db), release() {} }) };
    await scanScheduleReminders(pool, async () => false, new Date("2026-11-02T10:00:30Z"));
    let row = (await db.query("SELECT * FROM schedule_entries")).rows[0];
    assert.equal(row.next_run_at.toISOString(), "2026-11-02T10:00:00.000Z");
    assert.equal(row.last_run_at, null);
    await scanScheduleReminders(pool, async () => { throw new Error("Must skip stale push"); }, new Date("2026-11-02T12:20Z"));
    row = (await db.query("SELECT * FROM schedule_entries")).rows[0];
    assert.equal(row.next_run_at.toISOString(), "2026-11-02T13:00:00.000Z");
    assert.equal(row.last_run_at, null);
  } finally { await db.close(); }
});
