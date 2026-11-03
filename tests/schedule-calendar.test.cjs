const test = require('node:test');
const assert = require('node:assert/strict');

test('month grid starts Monday and covers all days including leap day', () => {
  const { calendarDays } = require('../lib/schedule-calendar.cjs');
  const days = calendarDays('2028-02-15', 'month');
  assert.equal(days.length, 42);
  assert.equal(days[0], '2028-01-31');
  assert.ok(days.includes('2028-02-29'));
  assert.deepEqual(calendarDays('2026-11-04', 'week'), ['2026-11-02','2026-11-03','2026-11-04','2026-11-05','2026-11-06','2026-11-07','2026-11-08']);
});

test('calendar expands recurring dates in display timezone and excludes paused entries', () => {
  const { occurrencesForDay } = require('../lib/schedule-calendar.cjs');
  const entry = { id: 1, title: 'Break', kind: 'interval', startsAt: '2026-11-02T08:00Z', timeZone: 'Europe/Zurich', intervalMinutes: 60, weekdays: [1], activeStart: '09:00', activeEnd: '12:00', enabled: true };
  assert.deepEqual(occurrencesForDay([entry], '2026-11-02', 'Europe/Zurich').map(x => x.at), ['2026-11-02T08:00:00.000Z','2026-11-02T09:00:00.000Z','2026-11-02T10:00:00.000Z']);
  assert.equal(occurrencesForDay([{ ...entry, enabled: false }], '2026-11-02', 'UTC').length, 0);
  const once = { ...entry, kind: 'once', startsAt: '2026-11-02T23:30Z' };
  assert.equal(occurrencesForDay([once], '2026-11-03', 'Europe/Zurich').length, 1);
  assert.equal(occurrencesForDay([once], '2026-11-02', 'Europe/Zurich').length, 0);
  assert.equal(occurrencesForDay([entry], '2026-11-02', 'Europe/Zurich', 2).length, 2);
});
