const TARGET_MINUTES = 504;
const formatters = new Map();
const midnights = new Map();
function dayKey(instant, timeZone = 'Europe/Zurich') {
  if (!formatters.has(timeZone)) formatters.set(timeZone, new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }));
  const parts = formatters.get(timeZone).formatToParts(new Date(instant));
  const get = (type) => parts.find((part) => part.type === type).value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}
function addDays(date, n) {
  const value = new Date(`${date}T12:00:00Z`);
  value.setUTCDate(value.getUTCDate() + n);
  return value.toISOString().slice(0, 10);
}
function weekday(date) { return new Date(`${date}T12:00:00Z`).getUTCDay(); }
function midnight(date, zone) {
  const key = `${zone}/${date}`;
  if (!midnights.has(key)) {
    const center = Date.parse(`${date}T00:00:00Z`);
    let low = center - 36 * 3600000, high = center + 36 * 3600000;
    while (low < high) {
      const middle = Math.floor((low + high) / 2);
      if (dayKey(middle, zone) < date) low = middle + 1; else high = middle;
    }
    // Bound the cross-call cache when this engine is used in a long-lived server.
    if (midnights.size > 20000) midnights.clear();
    midnights.set(key, low);
  }
  return midnights.get(key);
}
function summarize(state, nowMs = Date.now()) {
  const zone = state.settings.timeZone;
  const today = dayKey(nowMs, zone);
  const byDate = new Map();
  for (let date = state.settings.startDate; date <= today; date = addDays(date, 1)) {
    const dow = weekday(date);
    const kinds = new Set(state.events.filter((e) => e.startDate <= date && date <= e.endDate).map((e) => e.kind));
    const scheduled = dow !== 0 && dow !== 6;
    let type = !scheduled ? 'off' : dow <= 3 || kinds.has('school_holiday') ? 'work' : 'school';
    if (scheduled) {
      if (kinds.has('public_holiday')) type = 'public_holiday';
      else if (kinds.has('holiday')) type = 'holiday';
      else if (kinds.has('sick')) type = 'sick';

    }
    byDate.set(date, {date, type, expectedMinutes: scheduled ? TARGET_MINUTES : 0, workedMinutes: 0, creditMinutes: 0, totalMinutes: 0, balanceMinutes: 0, remainingMinutes: 0, lunchMinutes: 0, lunchMet: false, finishAt: null});
  }
  const sessions = [...state.sessions, ...(state.active ? [{...state.active, end: new Date(nowMs).toISOString()}] : [])];
  for (const session of sessions) {
    let cursor = Date.parse(session.start);
    const end = Math.min(Date.parse(session.end), nowMs);
    let doctorRemaining = 60;
    while (cursor < end) {
      const date = dayKey(cursor, zone);
      const until = Math.min(end, midnight(addDays(date, 1), zone));
      if (until <= cursor) break;
      const minutes = (until - cursor) / 60000;
      const doctorCredit = session.kind === 'doctor' ? Math.min(doctorRemaining, minutes) : 0;
      doctorRemaining -= doctorCredit;
      const day = byDate.get(date);
      if (day) {
        if (session.kind === 'work') day.workedMinutes += minutes;
        if (session.kind === 'doctor') day.creditMinutes += doctorCredit;
        if (session.kind === 'therapy') day.creditMinutes += minutes;
        // Lunch is one continuous BREAK within the local day, never doctor/therapy/other.
        if (session.kind === 'break') day.lunchMinutes = Math.max(day.lunchMinutes, minutes);
      }
      cursor = until;
    }
  }
  const days = [...byDate.values()];
  for (const day of days) {
    const schoolAttended = day.type === 'school' && state.events.some((event) => event.kind === 'school' && event.startDate <= day.date && day.date <= event.endDate);
    if (schoolAttended || ['holiday', 'public_holiday', 'sick'].includes(day.type)) {
      day.creditMinutes = Math.max(0, day.expectedMinutes - day.workedMinutes);
    }
    day.totalMinutes = day.workedMinutes + day.creditMinutes;
    day.balanceMinutes = day.totalMinutes - day.expectedMinutes;
    day.remainingMinutes = Math.max(0, -day.balanceMinutes);
    day.lunchMet = day.lunchMinutes >= 30;
    if (day.date === today && day.type === 'work' && ['work', 'break'].includes(state.active?.kind)) {
      let lunchNeeded = day.lunchMet ? 0 : 30;
      if (!day.lunchMet && state.active.kind === 'break') {
        const elapsed = Math.max(0, (nowMs - Math.max(Date.parse(state.active.start), midnight(today, zone))) / 60000);
        lunchNeeded = Math.max(0, 30 - elapsed);
      }
      day.finishAt = new Date(nowMs + (day.remainingMinutes + lunchNeeded) * 60000).toISOString();
    }
  }
  function aggregate(selected) {
    const result = {expectedMinutes: 0, workedMinutes: 0, creditMinutes: 0, overtimeMinutes: 0, missingMinutes: 0, balanceMinutes: 0};
    for (const day of selected) {
      result.expectedMinutes += day.expectedMinutes;
      result.workedMinutes += day.workedMinutes;
      result.creditMinutes += day.creditMinutes;
      result.overtimeMinutes += Math.max(0, day.balanceMinutes);
      result.missingMinutes += day.date < today ? Math.max(0, -day.balanceMinutes) : 0;
    }
    result.balanceMinutes = result.overtimeMinutes - result.missingMinutes;
    return result;
  }
  const monday = addDays(today, -((weekday(today) + 6) % 7));
  const overall = aggregate(days);
  overall.balanceMinutes += state.settings.openingBalanceMinutes;
  // Attendance is physical work + confirmed school, never excusal/appointment credit.
  const monthStart = `${today.slice(0, 7)}-01`;
  const attendanceStart = state.settings.startDate > monthStart ? state.settings.startDate : monthStart;
  let attendedMinutes = 0, expectedToDateMinutes = 0, expectedMonthMinutes = 0;
  for (let date = attendanceStart; date.slice(0, 7) === today.slice(0, 7); date = addDays(date, 1)) {
    const scheduled = ![0, 6].includes(weekday(date));
    if (scheduled) expectedMonthMinutes += TARGET_MINUTES;
    if (date > today) continue;
    if (scheduled) expectedToDateMinutes += TARGET_MINUTES;
    const day = byDate.get(date);
    if (!day) continue;
    const schoolAttended = day.type === 'school' && state.events.some(event => event.kind === 'school' && event.startDate <= date && date <= event.endDate);
    attendedMinutes += day.workedMinutes + (schoolAttended ? Math.max(0, TARGET_MINUTES - day.workedMinutes) : 0);
  }
  const targetMinutes = expectedMonthMinutes * 0.9;
  const attendance = {
    month: today.slice(0, 7), startDate: attendanceStart, targetPercent: 90,
    attendedMinutes, expectedToDateMinutes, expectedMonthMinutes, targetMinutes,
    percentToDate: expectedToDateMinutes > 0 ? attendedMinutes / expectedToDateMinutes * 100 : null,
    percentOfMonth: expectedMonthMinutes > 0 ? attendedMinutes / expectedMonthMinutes * 100 : null,
    remainingMinutes: Math.max(0, targetMinutes - attendedMinutes),
    targetMet: expectedMonthMinutes > 0 && attendedMinutes >= targetMinutes,
  };
  const year = Number(today.slice(0, 4));
  const holidays = new Set(), publicHolidays = new Set();
  for (const event of state.events) {
    if (!['holiday', 'public_holiday'].includes(event.kind)) continue;
    const first = event.startDate > `${year}-01-01` ? event.startDate : `${year}-01-01`;
    const last = event.endDate < `${year}-12-31` ? event.endDate : `${year}-12-31`;
    for (let date = first; date <= last; date = addDays(date, 1)) {
      if ([0, 6].includes(weekday(date))) continue;
      (event.kind === 'holiday' ? holidays : publicHolidays).add(date);
    }
  }
  for (const date of publicHolidays) holidays.delete(date);
  let usedDays = 0, plannedDays = 0, run = 0, hasLeave = false, twoWeekBlock = false;
  for (const date of holidays) { if (date <= today) usedDays++; else plannedDays++; }
  // A block is ten consecutive weekdays covered by approved holiday or public holiday;
  // weekends bridge the block, public holidays don't consume allowance. At least one
  // approved holiday must occur in the block. School days also consume leave.
  for (let date = `${year}-01-01`; date <= `${year}-12-31`; date = addDays(date, 1)) {
    if ([0, 6].includes(weekday(date))) continue;
    if (holidays.has(date) || publicHolidays.has(date)) { run++; hasLeave ||= holidays.has(date); }
    else { run = 0; hasLeave = false; }
    if (run >= 10 && hasLeave) twoWeekBlock = true;
  }
  return {today, days, attendance, week: aggregate(days.filter((d) => d.date >= monday)), month: aggregate(days.filter((d) => d.date.slice(0, 7) === today.slice(0, 7))), overall,
    leave: {year, allowanceDays: 30, usedDays, plannedDays, remainingDays: 30 - usedDays - plannedDays, twoWeekBlock},
    activeMinutes: state.active ? Math.max(0, (nowMs - Date.parse(state.active.start)) / 60000) : 0};
}
module.exports = {TARGET_MINUTES, dayKey, addDays, summarize};
