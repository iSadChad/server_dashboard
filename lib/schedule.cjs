const MINUTE = 60_000;

function parseDuration(value) {
  const text = value.trim().toLowerCase();
  if (!text) return null;
  const match = /^(?:(\d+(?:\.\d+)?)\s*h(?:\s*(\d+)\s*m)?|(\d+)\s*m?)$/.exec(text);
  let minutes = match ? (match[1] === undefined ? Number(match[3]) : Number(match[1]) * 60 + Number(match[2] || 0)) : NaN;
  // Correct binary floating-point noise, not genuinely fractional minutes.
  if (match?.[1] !== undefined && Math.abs(minutes - Math.round(minutes)) <= Number.EPSILON * Math.max(1, Math.abs(minutes)) * 2) {
    minutes = Math.round(minutes);
  }
  if (!Number.isInteger(minutes) || minutes < 1 || minutes > 10080) throw new Error("Duration must be 1–10080 whole minutes. Try 1h, 1h 30m, or 45m.");
  return minutes;
}

function formatDuration(minutes) {
  if (!minutes) return "";
  return [Math.floor(minutes / 60) ? `${Math.floor(minutes / 60)}h` : "", minutes % 60 ? `${minutes % 60}m` : ""].filter(Boolean).join(" ");
}

function localParts(date, timeZone) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(date);
  return Object.fromEntries(parts.filter((part) => part.type !== "literal").map((part) => [part.type, Number(part.value)]));
}

function wallTime(parts) {
  return Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute);
}

function localInstant(parts, timeZone) {
  const target = wallTime(parts);
  let instant = target;
  for (let i = 0; i < 4; i += 1) {
    instant += target - wallTime(localParts(new Date(instant), timeZone));
  }
  // Skip nonexistent spring-forward times; choose the first fall-back occurrence.
  const candidates = [instant - 3600000, instant, instant + 3600000];
  return candidates.find((value) => wallTime(localParts(new Date(value), timeZone)) === target) ?? null;
}

function nextOccurrence(entry, after = new Date()) {
  const start = new Date(entry.startsAt).getTime();
  const boundary = new Date(after).getTime();
  if (entry.kind === "once") return start > boundary ? new Date(start).toISOString() : null;
  const weekdays = entry.weekdays || [];
  if (entry.kind === "interval") {
    const step = entry.intervalMinutes * MINUTE;
    let next = start + Math.max(0, Math.floor((boundary - start) / step) + 1) * step;
    const limit = next + 370 * 86400000;
    for (; next < limit; next += step) {
      const local = localParts(new Date(next), entry.timeZone);
      const weekday = new Date(wallTime(local)).getUTCDay();
      const clock = `${String(local.hour).padStart(2, "0")}:${String(local.minute).padStart(2, "0")}`;
      if (weekdays.length && !weekdays.includes(weekday)) continue;
      if (entry.activeStart && (clock < entry.activeStart || clock >= entry.activeEnd)) continue;
      return new Date(next).toISOString();
    }
    return null;
  }
  const anchor = localParts(new Date(start), entry.timeZone);
  const current = localParts(new Date(Math.max(start, boundary)), entry.timeZone);
  const day = new Date(Date.UTC(current.year, current.month - 1, current.day));
  for (let i = 0; i < 370; i += 1, day.setUTCDate(day.getUTCDate() + 1)) {
    if (entry.kind === "weekly" && !weekdays.includes(day.getUTCDay())) continue;
    const minute = localInstant({ year: day.getUTCFullYear(), month: day.getUTCMonth() + 1, day: day.getUTCDate(), hour: anchor.hour, minute: anchor.minute }, entry.timeZone);
    const next = minute === null ? null : minute + start % MINUTE;
    if (next !== null && next >= start && next > boundary) return new Date(next).toISOString();
  }
  return null;
}

function validateSchedule(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("Invalid schedule");
  const title = typeof input.title === "string" ? input.title.trim() : "";
  if (!title || title.length > 200) throw new Error("Title must contain 1–200 characters");
  if (input.notes !== undefined && (typeof input.notes !== "string" || input.notes.length > 5000)) throw new Error("Notes must be text, up to 5000 characters");
  if (!["once", "interval", "daily", "weekly"].includes(input.kind)) throw new Error("Choose a valid schedule type");
  if (typeof input.startsAt !== "string" || !/(Z|[+-]\d{2}:\d{2})$/.test(input.startsAt) || !Number.isFinite(Date.parse(input.startsAt))) throw new Error("Choose a valid start date with timezone");
  if (typeof input.timeZone !== "string") throw new Error("Choose a valid timezone");
  try { new Intl.DateTimeFormat("en", { timeZone: input.timeZone }); }
  catch { throw new Error("Choose a valid timezone"); }
  if (input.kind === "interval" && (!Number.isInteger(input.intervalMinutes) || input.intervalMinutes < 1 || input.intervalMinutes > 10080)) throw new Error("Interval must be 1–10080 whole minutes");
  if (input.durationMinutes != null && (!Number.isInteger(input.durationMinutes) || input.durationMinutes < 1 || input.durationMinutes > 10080)) throw new Error("Duration must be 1–10080 whole minutes");
  const weekdays = input.weekdays ?? [];
  if (!Array.isArray(weekdays) || weekdays.some((day) => !Number.isInteger(day) || day < 0 || day > 6)) throw new Error("Invalid weekdays");
  if (input.kind === "weekly" && !weekdays.length) throw new Error("Select at least one weekday");
  const activeStart = input.activeStart || null;
  const activeEnd = input.activeEnd || null;
  const clock = /^([01]\d|2[0-3]):[0-5]\d$/;
  if ((activeStart || activeEnd) && (input.kind !== "interval" || !clock.test(activeStart) || !clock.test(activeEnd) || activeStart >= activeEnd)) throw new Error("Active hours require a start before the end on the same day");
  for (const field of ["enabled", "notifications"]) {
    if (input[field] !== undefined && typeof input[field] !== "boolean") throw new Error(`${field} must be true or false`);
  }
  return {
    title, notes: input.notes || "", kind: input.kind,
    startsAt: new Date(input.startsAt).toISOString(), timeZone: input.timeZone,
    intervalMinutes: input.kind === "interval" ? input.intervalMinutes : null,
    durationMinutes: input.durationMinutes ?? null,
    weekdays: ["interval", "weekly"].includes(input.kind) ? [...new Set(weekdays)].sort() : [],
    activeStart, activeEnd, notifications: input.notifications ?? true, enabled: input.enabled ?? true,
  };
}

module.exports = { nextOccurrence, validateSchedule, parseDuration, formatDuration };
