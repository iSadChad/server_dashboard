const test = require("node:test");
const assert = require("node:assert/strict");

test("optional appointment durations accept hours and minutes and format compactly", () => {
  const { parseDuration, formatDuration, validateSchedule } = require("../lib/schedule.cjs");
  for (const [input, minutes, label] of [["", null, ""], ["1h", 60, "1h"], ["1h 30m", 90, "1h 30m"], ["45m", 45, "45m"], ["90", 90, "1h 30m"], ["1.5h", 90, "1h 30m"]]) {
    assert.equal(parseDuration(input), minutes);
    assert.equal(formatDuration(minutes), label);
  }
  for (const input of ["0", "-1h", "1.2m", "hello", "1h junk", "10081", "Infinity"]) assert.throws(() => parseDuration(input), /Duration/);
  const base = { title: "Therapy", kind: "once", startsAt: "2099-01-01T10:00Z", timeZone: "UTC" };
  assert.equal(validateSchedule(base).durationMinutes, null);
  assert.equal(validateSchedule({ ...base, durationMinutes: 60 }).durationMinutes, 60);
  assert.equal(validateSchedule({ ...base, durationMinutes: null }).durationMinutes, null);
  for (const durationMinutes of [0, -1, 1.5, "60", true, 10081]) assert.throws(() => validateSchedule({ ...base, durationMinutes }), /Duration/);
});

for (const [input, minutes] of [["2.05h", 123], ["4.1h", 246], ["8.2h", 492]]) {
  test(`decimal-hour duration ${input} accepts whole minutes without floating-point errors`, () => {
    const { parseDuration } = require("../lib/schedule.cjs");
    assert.equal(parseDuration(input), minutes);
  });
}

test("decimal-hour durations reject fractional minutes", () => {
  const { parseDuration } = require("../lib/schedule.cjs");
  for (const input of ["1.001h", "2.051h", "1.001h 30m"]) {
    assert.throws(() => parseDuration(input), /Duration/, input);
  }
});

test("interval schedules advance past missed occurrences without drifting", () => {
  const { nextOccurrence } = require("../lib/schedule.cjs");
  const entry = { kind: "interval", startsAt: "2026-11-02T08:00:00Z", timeZone: "Europe/Zurich", intervalMinutes: 60, weekdays: [] };
  assert.equal(nextOccurrence(entry, new Date("2026-11-02T10:12:00Z")), "2026-11-02T11:00:00.000Z");
  assert.equal(nextOccurrence(entry, new Date("2026-11-02T07:00:00Z")), "2026-11-02T08:00:00.000Z");
});

test("once, daily and weekly schedules respect timezone and daylight saving", () => {
  const { nextOccurrence } = require("../lib/schedule.cjs");
  const base = { startsAt: "2026-03-27T08:00:00Z", timeZone: "Europe/Zurich", weekdays: [] };
  assert.equal(nextOccurrence({ ...base, kind: "once" }, new Date("2026-03-28T00:00Z")), null);
  assert.equal(nextOccurrence({ ...base, kind: "daily" }, new Date("2026-03-28T08:00Z")), "2026-03-29T07:00:00.000Z");
  assert.equal(nextOccurrence({ ...base, kind: "weekly", weekdays: [1] }, new Date("2026-03-28T08:00Z")), "2026-03-30T07:00:00.000Z");
});

test("interval active hours and weekdays skip nights and weekends", () => {
  const { nextOccurrence } = require("../lib/schedule.cjs");
  const entry = { kind: "interval", startsAt: "2026-11-02T08:00Z", timeZone: "Europe/Zurich", intervalMinutes: 60, weekdays: [1,2,3,4,5], activeStart: "09:00", activeEnd: "17:00" };
  assert.equal(nextOccurrence(entry, new Date("2026-11-06T15:00Z")), "2026-11-09T08:00:00.000Z");
});

test("schedule validation rejects unsafe or incomplete schedules", () => {
  const { validateSchedule } = require("../lib/schedule.cjs");
  const valid = { title: "Break", kind: "interval", startsAt: "2030-11-02T08:00Z", timeZone: "Europe/Zurich", intervalMinutes: 60 };
  const normalized = validateSchedule(valid);
  assert.equal(normalized.title, "Break");
  assert.equal(normalized.enabled, true);
  assert.equal(normalized.notifications, true);
  for (const updates of [
    { title: " " }, { kind: "invalid" }, { startsAt: "bad" }, { timeZone: "Mars/Base" },
    { intervalMinutes: 0 }, { intervalMinutes: 1.5 }, { weekdays: [8] },
    { activeStart: "17:00", activeEnd: "09:00" }, { activeStart: "09:00" },
    { notifications: "false" }, { enabled: "false" }, { kind: "weekly", weekdays: [] },
  ]) assert.throws(() => validateSchedule({ ...valid, ...updates }));
});

test("DST gaps skip a day and repeated local times fire only once", () => {
  const { nextOccurrence } = require("../lib/schedule.cjs");
  const spring = { kind: "daily", startsAt: "2026-03-28T01:30Z", timeZone: "Europe/Zurich" };
  assert.equal(nextOccurrence(spring, new Date(spring.startsAt)), "2026-03-30T00:30:00.000Z");
  const autumn = { kind: "daily", startsAt: "2026-10-24T00:30Z", timeZone: "Europe/Zurich" };
  assert.equal(nextOccurrence(autumn, new Date("2026-10-25T00:30Z")), "2026-10-26T01:30:00.000Z");
});

test("daily entries preserve the initial instant when it contains seconds", () => {
  const { nextOccurrence } = require("../lib/schedule.cjs");
  const entry = { kind: "daily", startsAt: "2026-11-03T10:30:25Z", timeZone: "UTC" };
  assert.equal(nextOccurrence(entry, new Date("2026-11-03T10:00Z")), "2026-11-03T10:30:25.000Z");
});
