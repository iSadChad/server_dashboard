const test = require("node:test");
const assert = require("node:assert/strict");

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
