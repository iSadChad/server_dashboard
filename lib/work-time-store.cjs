const { randomUUID } = require('node:crypto');
const { dayKey, addDays } = require('./work-time.cjs');
const schemaPromises = new WeakMap();
const sessionKinds = new Set(['work', 'doctor', 'therapy', 'break', 'other']);
const eventKinds = new Set(['school', 'holiday', 'public_holiday', 'school_holiday', 'sick']);
function clientError(status, message) { return Object.assign(new Error(message), {status}); }
function invalid(message) { throw clientError(400, message); }
function object(value) { return value && typeof value === 'object' && !Array.isArray(value); }
function civil(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const ms = Date.parse(`${value}T00:00:00Z`);
  return Number.isFinite(ms) && new Date(ms).toISOString().slice(0, 10) === value && value >= '1900-01-01' && value <= '9999-12-31';
}
function instant(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/.test(value) || !civil(value.slice(0,10)) || !Number.isFinite(Date.parse(value))) invalid('Invalid session timestamp');
  // Date.parse permits 24:00; require a genuine time of day.
  if (Number(value.slice(11,13)) > 23 || Number(value.slice(14,16)) > 59 || Number(value.slice(17,19)) > 59) invalid('Invalid session timestamp');
  return new Date(value).toISOString();
}
function initialState(now = Date.now()) {
  return {version:0, settings:{startDate:dayKey(now,'Europe/Zurich'),timeZone:'Europe/Zurich',openingBalanceMinutes:0},sessions:[],events:[],active:null};
}
function ensureSchema(db) {
  if (!schemaPromises.has(db)) {
    const pending = Promise.resolve().then(async () => {
      await db.query(`CREATE TABLE IF NOT EXISTS work_time_state (
        id SMALLINT PRIMARY KEY CHECK (id = 1), state JSONB NOT NULL
      )`);
      await db.query('INSERT INTO work_time_state (id, state) VALUES (1, $1::jsonb) ON CONFLICT (id) DO NOTHING', [JSON.stringify(initialState())]);
    }).catch(error => {schemaPromises.delete(db);throw error;});
    schemaPromises.set(db,pending);
  }
  return schemaPromises.get(db);
}
function validateSettings(settings, now) {
  if (!object(settings) || !civil(settings.startDate) || typeof settings.timeZone !== 'string' || settings.timeZone.length > 100) invalid('Invalid tracker settings');
  let today;
  try { today = dayKey(now,settings.timeZone); } catch { invalid('Invalid time zone'); }
  const earliest = `${Number(today.slice(0,4))-10}${today.slice(4)}`;
  if (settings.startDate < earliest || settings.startDate > today) invalid('Start date must be within the past ten years');
  if (!Number.isSafeInteger(settings.openingBalanceMinutes) || Math.abs(settings.openingBalanceMinutes) > 10000000) invalid('Invalid opening balance');
  return {startDate:settings.startDate,timeZone:settings.timeZone,openingBalanceMinutes:settings.openingBalanceMinutes};
}
function validateEvent(event) {
  if (!object(event) || !eventKinds.has(event.kind) || !civil(event.startDate) || !civil(event.endDate) || event.endDate < event.startDate || event.endDate >= addDays(event.startDate,366)) invalid('Invalid event: use a date range of at most 366 days');
  const note = event.note ?? '';
  if (typeof note !== 'string' || note.length > 2000) invalid('Event note is too long');
  return {id:randomUUID(),kind:event.kind,startDate:event.startDate,endDate:event.endDate,note};
}
function applyCommand(state, body, now) {
  const nowISO = new Date(now).toISOString();
  function closeActive() {
    if (Date.parse(state.active.start) > now) throw clientError(409,'Server time precedes the active session');
    state.sessions.push({...state.active,end:nowISO});
    state.active = null;
  }
  switch (body.action) {
    case 'configure': state.settings = validateSettings(body.settings,now); break;
    case 'set_clock_in': {
      if (state.active && state.active.kind !== 'work') throw clientError(409,'End your current absence before setting a clock-in time');
      const start = instant(body.start);
      if (Date.parse(start) > now) invalid('Clock-in time cannot be in the future');
      const date = dayKey(start,state.settings.timeZone);
      if (date !== dayKey(now,state.settings.timeZone)) invalid('Choose a clock-in time from today; use a completed session for earlier days');
      if (state.sessions.some(session => Date.parse(session.end) > Date.parse(start) && Date.parse(session.start) < now)) throw clientError(409,'Clock-in time overlaps a recorded session; choose a time after your last session');
      state.active = {id:state.active?.id || randomUUID(),kind:'work',start};
      break;
    }
    case 'clock_in':
      if (state.active?.kind === 'work') throw clientError(409,'Already clocked in');
      if (state.active) closeActive();
      state.active = {id:randomUUID(),kind:'work',start:nowISO};
      break;
    case 'clock_out': {
      if (!['break','doctor','therapy','other','finish','sick'].includes(body.reason)) invalid('Invalid clock-out reason');
      if (state.active?.kind !== 'work') throw clientError(409,'Clock in before clocking out');
      closeActive();
      if (sessionKinds.has(body.reason)) state.active = {id:randomUUID(),kind:body.reason,start:nowISO};
      if (body.reason === 'sick') {
        const today = dayKey(now,state.settings.timeZone);
        state.events.push(validateEvent({kind:'sick',startDate:today,endDate:today}));
      }
      break;
    }
    case 'end_absence':
      if (!state.active || state.active.kind === 'work') throw clientError(409,'No active absence');
      closeActive(); break;
    case 'add_event': state.events.push(validateEvent(body.event)); break;
    case 'delete_event':
    case 'delete_session': {
      if (typeof body.id !== 'string' || !body.id || body.id.length > 100) invalid('Invalid record id');
      const list = body.action === 'delete_event' ? state.events : state.sessions;
      const index = list.findIndex(item=>item.id===body.id);
      if (index < 0) throw clientError(409,'Record no longer exists; reload');
      list.splice(index,1); break;
    }
    case 'add_session': {
      const session = body.session;
      if (!object(session) || !sessionKinds.has(session.kind)) invalid('Invalid session kind');
      const start = instant(session.start), end = instant(session.end);
      if (Date.parse(end) <= Date.parse(start) || Date.parse(end) > now) invalid('Session must end after its start and not in the future');
      const overlaps = state.sessions.some(item => Date.parse(start) < Date.parse(item.end) && Date.parse(end) > Date.parse(item.start));
      if (overlaps || (state.active && Date.parse(end) > Date.parse(state.active.start))) throw clientError(409,'Session overlaps an existing session');
      state.sessions.push({id:randomUUID(),kind:session.kind,start,end});
      state.sessions.sort((a,b)=>Date.parse(a.start)-Date.parse(b.start));
      break;
    }
    default: invalid('Unknown tracker action');
  }
  state.version++;
  return state;
}
function createWorkTimeStore(pool) {
  return {
    async get() {
      await ensureSchema(pool);
      const result = await pool.query('SELECT state FROM work_time_state WHERE id = 1');
      return {state:result.rows[0].state,serverNow:new Date().toISOString()};
    },
    async command(body) {
      if (!object(body) || !Number.isSafeInteger(body.version) || body.version < 0 || typeof body.action !== 'string') invalid('A valid version and action are required');
      await ensureSchema(pool);
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        const result = await client.query('SELECT state FROM work_time_state WHERE id = 1 FOR UPDATE');
        const state = result.rows[0].state;
        if (state.version !== body.version) throw clientError(409,'Tracker changed; reload and try again');
        if (state.version >= Number.MAX_SAFE_INTEGER) throw clientError(409,'Tracker version limit reached');
        const now = Date.now();
        applyCommand(state,body,now);
        await client.query('UPDATE work_time_state SET state = $1::jsonb WHERE id = 1',[JSON.stringify(state)]);
        await client.query('COMMIT');
        return {state,serverNow:new Date(now).toISOString()};
      } catch (error) {
        try { await client.query('ROLLBACK'); } catch { /* Preserve the original failure. */ }
        throw error;
      } finally { client.release(); }
    },
  };
}
function getWorkTimeStore() {
  if (!process.env.WORK_TIME_DATABASE_URL) throw new Error('WORK_TIME_DATABASE_URL is not configured');
  if (!globalThis.workTimePool) {
    const {Pool} = require('pg');
    globalThis.workTimePool = new Pool({connectionString:process.env.WORK_TIME_DATABASE_URL});
  }
  return createWorkTimeStore(globalThis.workTimePool);
}
async function readJson(request) {
  try { return await request.json(); } catch { throw clientError(400,'Invalid JSON body'); }
}
function apiError(error) {
  const status = [400,409].includes(error.status) ? error.status : 500;
  return Response.json({status:'error',message:status === 500 ? 'Could not process work time request' : error.message},{status,headers:{'Cache-Control':'no-store'}});
}
module.exports = {createWorkTimeStore,getWorkTimeStore,ensureSchema,readJson,apiError};
