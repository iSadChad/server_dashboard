const { validateSchedule, nextOccurrence } = require("./schedule.cjs");

const schemaPromises = new WeakMap();
function ensureSchema(db) {
  if (!schemaPromises.has(db)) {
    const pending = Promise.resolve().then(() => db.query(`
      CREATE TABLE IF NOT EXISTS schedule_entries (
        id BIGSERIAL PRIMARY KEY,
        definition JSONB NOT NULL,
        next_run_at TIMESTAMPTZ NULL,
        last_run_at TIMESTAMPTZ NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `)).catch((error) => { schemaPromises.delete(db); throw error; });
    schemaPromises.set(db, pending);
  }
  return schemaPromises.get(db);
}

const iso = (value) => value == null ? null : new Date(value).toISOString();
function normalize(row) {
  return { ...row.definition, durationMinutes: row.definition.durationMinutes ?? null, id: Number(row.id), nextRunAt: iso(row.next_run_at),
    lastRunAt: iso(row.last_run_at), createdAt: iso(row.created_at), updatedAt: iso(row.updated_at) };
}

function clientError(status, message) {
  return Object.assign(new Error(message), { status });
}
const fields = new Set(["title", "notes", "kind", "startsAt", "timeZone", "intervalMinutes", "durationMinutes", "weekdays", "activeStart", "activeEnd", "notifications", "enabled"]);
const timingFields = ["kind", "startsAt", "timeZone", "intervalMinutes", "weekdays", "activeStart", "activeEnd"];
function checkBody(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) throw clientError(400, "Invalid schedule");
  if (Object.keys(body).some((key) => !fields.has(key))) throw clientError(400, "Unknown schedule field");
}
function validate(body) {
  try { return validateSchedule(body); }
  catch (error) { throw clientError(400, error.message); }
}
function identifier(raw) {
  if (!/^[0-9]+$/.test(String(raw)) || !Number.isSafeInteger(Number(raw)) || Number(raw) <= 0) {
    throw clientError(400, "Invalid schedule id");
  }
  return Number(raw);
}
function futureOccurrence(definition, now) {
  const next = nextOccurrence(definition, now);
  if (!next) throw clientError(400, "Schedule has no future occurrence");
  return next;
}

function createScheduleStore(db) {
  return {
    async list() {
      await ensureSchema(db);
      const result = await db.query("SELECT * FROM schedule_entries ORDER BY id ASC");
      return result.rows.map(normalize);
    },
    async create(body) {
      checkBody(body);
      const definition = validate(body);
      const now = new Date();
      if (Date.parse(definition.startsAt) <= now.getTime()) throw clientError(400, "Start date must be in the future");
      const next = futureOccurrence(definition, now);
      await ensureSchema(db);
      const result = await db.query(`INSERT INTO schedule_entries (definition, next_run_at)
        VALUES ($1::jsonb, $2) RETURNING *`, [JSON.stringify(definition), definition.enabled ? next : null]);
      return normalize(result.rows[0]);
    },
    async update(rawId, body) {
      const id = identifier(rawId);
      checkBody(body);
      await ensureSchema(db);
      // Keep the native timestamp text: JS Date loses Postgres microseconds.
      const current = (await db.query("SELECT *, updated_at::text AS version, next_run_at::text AS next_version, last_run_at::text AS last_version FROM schedule_entries WHERE id = $1", [id])).rows[0];
      if (!current) throw clientError(404, "Schedule not found");
      const definition = validate({ ...current.definition, ...body });
      const timingChanged = timingFields.some((key) => JSON.stringify(definition[key]) !== JSON.stringify(current.definition[key]));
      let next = current.next_version;
      if (!definition.enabled) {
        // Validate edited recurrences even while paused, without restarting them.
        if (timingChanged && definition.kind !== "once") futureOccurrence(definition, new Date());
        next = null;
      } else if (timingChanged || !current.definition.enabled) {
        next = futureOccurrence(definition, new Date());
      }
      // A worker's row lock makes this wait, then Postgres rechecks the version
      // and progress predicates. Never overwrite a send completed since SELECT.
      const result = await db.query(`UPDATE schedule_entries SET definition = $1::jsonb,
        next_run_at = $2, updated_at = GREATEST(clock_timestamp(), updated_at + INTERVAL '1 microsecond')
        WHERE id = $3 AND updated_at = $4::timestamptz
          AND next_run_at IS NOT DISTINCT FROM $5::timestamptz
          AND last_run_at IS NOT DISTINCT FROM $6::timestamptz
        RETURNING *`, [JSON.stringify(definition), next, id, current.version, current.next_version, current.last_version]);
      if (!result.rows.length) throw clientError(409, "Schedule changed; reload and try again");
      return normalize(result.rows[0]);
    },
    async remove(rawId) {
      const id = identifier(rawId);
      await ensureSchema(db);
      const result = await db.query("DELETE FROM schedule_entries WHERE id = $1 RETURNING id", [id]);
      if (!result.rows.length) throw clientError(404, "Schedule not found");
    },
  };
}

function getScheduleStore() {
  if (!process.env.TASKS_DATABASE_URL) throw new Error("Schedule database is not configured");
  if (!globalThis.tasksPool) {
    const { Pool } = require("pg");
    globalThis.tasksPool = new Pool({ connectionString: process.env.TASKS_DATABASE_URL });
  }
  return createScheduleStore(globalThis.tasksPool);
}

async function readJson(request) {
  try { return await request.json(); }
  catch { throw clientError(400, "Invalid JSON body"); }
}

function apiError(error) {
  const status = [400, 404, 409].includes(error.status) ? error.status : 500;
  return Response.json({ status: "error", message: status === 500 ? "Could not process schedule request" : error.message }, { status });
}

module.exports = { createScheduleStore, ensureSchema, getScheduleStore, readJson, apiError };
