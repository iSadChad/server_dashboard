const { nextOccurrence } = require('./schedule.cjs');

function calendarDays(anchor, view) {
  const date = new Date(`${anchor}T12:00:00Z`);
  if (view === 'month') date.setUTCDate(1);
  date.setUTCDate(date.getUTCDate() - (date.getUTCDay() + 6) % 7);
  return Array.from({ length: view === 'month' ? 42 : 7 }, (_, index) => {
    const day = new Date(date);
    day.setUTCDate(day.getUTCDate() + index);
    return day.toISOString().slice(0, 10);
  });
}

function dayBoundary(day, timeZone) {
  const target = Date.parse(`${day}T00:00:00Z`);
  let instant = target;
  const formatter = new Intl.DateTimeFormat('en-GB', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
  for (let i = 0; i < 4; i += 1) {
    const parts = Object.fromEntries(formatter.formatToParts(new Date(instant)).map(p => [p.type, p.value]));
    const local = Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day), Number(parts.hour), Number(parts.minute));
    instant += target - local;
  }
  return instant;
}

function occurrencesForDay(entries, day, timeZone, limit = 200) {
  const start = dayBoundary(day, timeZone);
  const tomorrow = new Date(`${day}T12:00Z`);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
  const end = dayBoundary(tomorrow.toISOString().slice(0, 10), timeZone);
  const occurrences = [];
  for (const entry of entries) {
    if (!entry.enabled) continue;
    let at = nextOccurrence(entry, new Date(start - 1));
    let count = 0;
    while (at && Date.parse(at) < end && count < limit) {
      occurrences.push({ entry, at });
      count += 1;
      at = nextOccurrence(entry, new Date(at));
    }
  }
  return occurrences.sort((a, b) => a.at.localeCompare(b.at) || a.entry.title.localeCompare(b.entry.title)).slice(0, limit);
}

module.exports = { calendarDays, occurrencesForDay };
