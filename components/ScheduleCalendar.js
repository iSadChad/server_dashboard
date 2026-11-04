"use client";

import { useMemo, useState } from "react";
import calendar from "../lib/schedule-calendar.cjs";
import schedule from "../lib/schedule.cjs";

const { calendarDays, occurrencesForDay } = calendar;
const { formatDuration } = schedule;
const button = "min-h-10 rounded-xl border border-cyan-300/25 px-3 py-2 text-xs text-cyan-100 hover:bg-cyan-300/10 disabled:opacity-40";
const names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function localDay() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

export default function ScheduleCalendar({ entries, timeZone, pending, onEdit, onCreate }) {
  const [view, setView] = useState("month");
  const [anchor, setAnchor] = useState(localDay);
  const [selected, setSelected] = useState(localDay);
  const dates = useMemo(() => calendarDays(anchor, view), [anchor, view]);
  // Bound expansion for dense interval schedules; never build an unbounded month.
  const selectedOccurrences = useMemo(() => occurrencesForDay(entries, selected, timeZone), [entries, selected, timeZone]);
  const previews = useMemo(() => view === "month" ? dates.map(day => occurrencesForDay(entries, day, timeZone, 3)) : [], [dates, entries, timeZone, view]);
  const week = useMemo(() => view === "week" ? dates.map(day => occurrencesForDay(entries, day, timeZone)) : [], [dates, entries, timeZone, view]);
  const title = view === "month" ? new Date(`${anchor}T12:00Z`).toLocaleDateString("en-GB", { month: "long", year: "numeric", timeZone: "UTC" }) : `${dates[0]} – ${dates[6]}`;
  const clock = at => new Date(at).toLocaleTimeString("en-GB", { timeZone, hour: "2-digit", minute: "2-digit" });
  const timeRange = (entry, at) => {
    if (!entry.durationMinutes) return clock(at);
    const end = new Date(Date.parse(at) + entry.durationMinutes * 60_000);
    const date = value => new Date(value).toLocaleDateString("en-GB", { timeZone, day: "2-digit", month: "short" });
    return `${clock(at)}–${clock(end)}${date(at) === date(end) ? "" : ` (${date(end)})`}`;
  };

  function move(direction) {
    const date = new Date(`${anchor}T12:00Z`);
    if (view === "month") { date.setUTCDate(1); date.setUTCMonth(date.getUTCMonth() + direction); }
    else date.setUTCDate(date.getUTCDate() + direction * 7);
    const next = date.toISOString().slice(0, 10);
    setAnchor(next); setSelected(next);
  }

  function occurrenceList(items) {
    return items.length ? items.map(({ entry, at }) => <button key={`${entry.id}-${at}`} type="button" disabled={pending} onClick={() => onEdit(entry)} aria-label={`Edit ${entry.title} at ${timeRange(entry, at)}`} className="block w-full rounded-lg border border-fuchsia-300/25 bg-fuchsia-400/10 p-2 text-left text-xs text-fuchsia-100 hover:bg-cyan-300/15 disabled:opacity-40"><time dateTime={at} className="font-mono text-cyan-200">{timeRange(entry, at)}</time><span className="ml-2 wrap-break-word">{entry.title}</span>{entry.durationMinutes && <span className="mt-1 block text-violet-200/75">{formatDuration(entry.durationMinutes)}</span>}</button>) : <p className="p-2 text-xs text-violet-200/55">No reminders</p>;
  }

  return <section aria-label="Schedule calendar" className="vapor-panel mb-6 min-w-0 rounded-3xl border border-fuchsia-300/20 p-3 sm:p-6">
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <h3 className="text-lg font-bold text-fuchsia-100" aria-live="polite">{title}</h3>
      <div className="flex flex-wrap gap-2">
        <div role="group" aria-label="Calendar view" className="flex gap-1">{["month", "week"].map(mode => <button key={mode} type="button" aria-pressed={view === mode} onClick={() => setView(mode)} className={`${button} ${view === mode ? "bg-cyan-300/20" : ""}`}>{mode === "month" ? "Month" : "Week"}</button>)}</div>
        <button type="button" onClick={() => move(-1)} aria-label={`Previous ${view}`} className={button}>←</button>
        <button type="button" onClick={() => { const day = localDay(); setAnchor(day); setSelected(day); }} className={button}>Today</button>
        <button type="button" onClick={() => move(1)} aria-label={`Next ${view}`} className={button}>→</button>
      </div>
    </div>
    <p className="mb-4 text-xs text-violet-200/65">Times shown in {timeZone}. Recurring dates are projections of the current schedule, not delivery history. Paused reminders are hidden. Up to 200 occurrences per day are shown.</p>
    {view === "month" ? <>
      <div className="grid grid-cols-7 gap-1" aria-label="Month calendar">
        {names.map(day => <div key={day} className="py-2 text-center text-[10px] text-cyan-200">{day}</div>)}
        {dates.map((day, index) => <button key={day} type="button" aria-label={`Show reminders for ${day}`} aria-pressed={selected === day} onClick={() => setSelected(day)} className={`min-h-12 min-w-0 overflow-hidden rounded-lg border p-1 text-sm sm:min-h-24 ${selected === day ? "border-cyan-200 bg-cyan-300/20 text-white" : day.slice(0, 7) === anchor.slice(0, 7) ? "border-fuchsia-300/15 text-fuchsia-100" : "border-violet-300/10 text-violet-200/35"}`}><time dateTime={day}>{Number(day.slice(-2))}</time>{day === localDay() && <span className="mx-auto mt-1 block h-1 w-1 rounded-full bg-cyan-200" />}<span className="mt-1 flex justify-center gap-1 sm:hidden">{previews[index].map(({ entry, at }) => <span key={`${entry.id}-${at}`} className="h-1 w-1 rounded-full bg-fuchsia-300" />)}</span><span className="hidden space-y-1 sm:block">{previews[index].map(({ entry, at }) => <span key={`${entry.id}-${at}`} className="block truncate rounded bg-fuchsia-400/15 px-1 text-[10px] text-fuchsia-100">{clock(at)} {entry.title}</span>)}</span></button>)}
      </div>
      <div className="mt-5 border-t border-fuchsia-300/20 pt-4"><div className="mb-3 flex flex-wrap items-center justify-between gap-2"><h4 className="text-sm font-semibold text-cyan-100">{selected} · {selectedOccurrences.length} occurrences</h4><button type="button" disabled={pending} onClick={() => onCreate(selected)} className={button}>Add reminder on {selected}</button></div><div className="max-h-96 space-y-2 overflow-y-auto">{occurrenceList(selectedOccurrences)}</div></div>
    </> : <div className="overflow-x-auto rounded-xl border border-fuchsia-300/15" tabIndex={0} aria-label="Weekly calendar, scroll horizontally on small screens">
      <div className="grid min-w-[840px] grid-cols-7 divide-x divide-fuchsia-300/15">{dates.map((day, index) => <div key={day} className="min-w-0 p-2"><div className="mb-3 border-b border-fuchsia-300/15 pb-2"><p className="text-xs font-bold text-cyan-100">{names[index]} {day.slice(5)}</p><button type="button" disabled={pending} onClick={() => onCreate(day)} aria-label={`Add reminder on ${day}`} className="mt-2 text-xs text-fuchsia-200 hover:text-white">+ Add</button></div><div className="max-h-[600px] space-y-2 overflow-y-auto">{occurrenceList(week[index])}</div></div>)}</div>
    </div>}
  </section>;
}
