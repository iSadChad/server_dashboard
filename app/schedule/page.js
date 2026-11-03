"use client";

import { cloneElement, useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import PageLayout from "../../components/PageLayout";
import TaskNotifications from "../../components/TaskNotifications";
import ScheduleCalendar from "../../components/ScheduleCalendar";

const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const kinds = { once: "One-time", interval: "Interval", daily: "Daily", weekly: "Weekly" };
const inputStyle = "vapor-input block min-w-0 w-full rounded-xl border border-fuchsia-300/20 px-3 py-3 text-sm outline-none disabled:opacity-50";
const buttonStyle = "vapor-button min-h-11 rounded-xl border border-cyan-300/25 px-3 py-2 text-xs font-bold text-cyan-100 transition-colors disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-cyan-200";

function newForm(timeZone = "") {
  return { title: "", notes: "", kind: "once", startsAt: "", timeZone, intervalMinutes: "60", weekdays: [], activeStart: "", activeEnd: "", notifications: true, enabled: true };
}

function localInput(value) {
  const date = new Date(value);
  const pad = (number) => String(number).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function buildPayload(form, creating) {
  if (!form.title.trim()) throw new Error("Enter a title for this reminder.");
  const start = new Date(form.startsAt);
  if (!form.startsAt || Number.isNaN(start.getTime())) throw new Error("Enter a valid start date and time.");
  if (creating && start.getTime() <= Date.now()) throw new Error("New reminders must start in the future.");
  const timeZone = form.timeZone.trim();
  try { new Intl.DateTimeFormat("en", { timeZone }).format(start); }
  catch { throw new Error("Enter a valid IANA time zone, such as Europe/Zurich."); }
  if (!timeZone) throw new Error("Enter an IANA time zone.");
  if (form.kind === "weekly" && !form.weekdays.length) throw new Error("Choose at least one weekday for a weekly reminder.");
  const interval = form.kind === "interval";
  const intervalMinutes = interval ? Number(form.intervalMinutes) : null;
  if (interval && (!Number.isSafeInteger(intervalMinutes) || intervalMinutes < 1)) throw new Error("The interval must be a positive whole number of minutes.");
  if (interval && Boolean(form.activeStart) !== Boolean(form.activeEnd)) throw new Error("Set both active-window times, or leave both empty.");
  if (interval && form.activeStart && form.activeStart >= form.activeEnd) throw new Error("The active window must end after it starts. Overnight windows are not supported.");
  return {
    title: form.title.trim(), notes: form.notes.trim(), kind: form.kind,
    startsAt: start.toISOString(), timeZone, intervalMinutes,
    weekdays: interval || form.kind === "weekly" ? [...form.weekdays].sort((a, b) => a - b) : [],
    activeStart: interval && form.activeStart ? form.activeStart : null,
    activeEnd: interval && form.activeEnd ? form.activeEnd : null,
    notifications: form.notifications, enabled: form.enabled,
  };
}

function formatInstant(value, timeZone) {
  if (!value) return "No upcoming run";
  try {
    return `${new Intl.DateTimeFormat("en-GB", { timeZone, day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZoneName: "short" }).format(new Date(value))} · ${timeZone}`;
  } catch { return `${value} · ${timeZone}`; }
}

function recurrence(entry) {
  let text = entry.kind === "interval" ? `Every ${entry.intervalMinutes} min` : kinds[entry.kind];
  if ((entry.kind === "weekly" || entry.kind === "interval") && entry.weekdays.length) text += ` · ${entry.weekdays.map((day) => days[day]).join(", ")}`;
  if (entry.kind === "interval" && !entry.weekdays.length) text += " · Every day";
  if (entry.kind === "interval" && entry.activeStart) text += ` · ${entry.activeStart}–${entry.activeEnd} (${entry.timeZone})`;
  return text;
}

async function requestSchedule(path = "", options = {}) {
  const response = await fetch(`/api/schedule${path}`, { cache: "no-store", ...options });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.message || data?.error || `Schedule request failed (${response.status}).`);
  if (options.method === "DELETE") return data;
  if (!data || (options.method ? !data.entry : !Array.isArray(data.entries))) throw new Error("The server returned an invalid schedule response. Please refresh.");
  return data;
}

export default function SchedulePage() {
  return <PageLayout><ScheduleContent /></PageLayout>;
}

function ScheduleContent() {
  const [entries, setEntries] = useState([]);
  const [form, setForm] = useState(() => newForm());
  const [editingId, setEditingId] = useState(null);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [notice, setNotice] = useState("");
  const [browserZone, setBrowserZone] = useState("");
  const busy = useRef(false);
  const mounted = useRef(false);
  const generation = useRef(0);
  const readController = useRef(null);
  const formSection = useRef(null);

  const refresh = useCallback(async () => {
    if (busy.current) return;
    const version = ++generation.current;
    readController.current?.abort();
    const controller = new AbortController();
    readController.current = controller;
    setRefreshing(true);
    try {
      const data = await requestSchedule("", { signal: controller.signal });
      if (mounted.current && version === generation.current) {
        setEntries(data.entries);
        setError("");
      }
    } catch (failure) {
      if (mounted.current && version === generation.current && failure.name !== "AbortError") setError(failure.message);
    } finally {
      if (mounted.current && version === generation.current) { setLoading(false); setRefreshing(false); }
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    let cancelled = false;
    Promise.resolve().then(() => {
      if (cancelled) return;
      const zone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
      setBrowserZone(zone);
      setForm((current) => ({ ...current, timeZone: current.timeZone || zone }));
      refresh();
    });
    const timer = setInterval(refresh, 30_000);
    return () => { cancelled = true; mounted.current = false; clearInterval(timer); };
  }, [refresh]);

  function resetForm() {
    setEditingId(null);
    setForm(newForm(browserZone));
    setFormError("");
  }

  function edit(entry) {
    setEditingId(entry.id);
    setForm({ ...entry, startsAt: localInput(entry.startsAt), intervalMinutes: String(entry.intervalMinutes ?? 60), activeStart: entry.activeStart || "", activeEnd: entry.activeEnd || "" });
    setFormError("");
    setNotice("");
    formSection.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    formSection.current?.querySelector("input")?.focus({ preventScroll: true });
  }

  async function mutate(id, method, payload, onSuccess) {
    if (busy.current) return;
    busy.current = true;
    ++generation.current;
    readController.current?.abort();
    setRefreshing(false);
    setLoading(false);
    setPending(true);
    setError("");
    setNotice("");
    let succeeded = false;
    try {
      const data = await requestSchedule(id === null ? "" : `/${encodeURIComponent(id)}`, {
        method,
        ...(payload ? { headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) } : {}),
      });
      if (!mounted.current) return;
      setEntries((current) => method === "DELETE" ? current.filter((entry) => entry.id !== id) : [data.entry, ...current.filter((entry) => entry.id !== data.entry.id)]);
      onSuccess();
      succeeded = true;
    } catch (failure) {
      if (mounted.current) setError(failure.message);
    } finally {
      busy.current = false;
      if (mounted.current) { setPending(false); if (succeeded) refresh(); }
    }
  }

  function save(event) {
    event.preventDefault();
    setFormError("");
    let payload;
    try { payload = buildPayload(form, editingId === null); }
    catch (failure) { setFormError(failure.message); return; }
    mutate(editingId, editingId === null ? "POST" : "PATCH", payload, () => {
      setNotice(editingId === null ? "Reminder created." : "Reminder updated.");
      resetForm();
    });
  }

  function remove(entry) {
    if (!window.confirm(`Delete “${entry.title}”? This cannot be undone.`)) return;
    mutate(entry.id, "DELETE", null, () => {
      if (editingId === entry.id) resetForm();
      setNotice("Reminder deleted.");
    });
  }

  const visibleEntries = useMemo(() => entries.filter((entry) => filter === "all" || (filter === "enabled" ? entry.enabled : !entry.enabled)).sort((a, b) => {
    const time = (entry) => entry.enabled && entry.nextRunAt ? new Date(entry.nextRunAt).getTime() : Infinity;
    return time(a) - time(b) || a.title.localeCompare(b.title);
  }), [entries, filter]);
  const upcoming = entries.filter((entry) => entry.enabled && entry.nextRunAt).length;
  const set = (field) => (event) => setForm((current) => ({ ...current, [field]: event.target.value }));

  return (
    <div className="vapor-page p-3 sm:p-4 lg:p-8">
      <div className="vapor-header page-command-header mb-6 flex flex-col gap-4 rounded-3xl border p-5 sm:flex-row sm:items-end sm:justify-between md:p-7">
        <div>
          <p className="vapor-kicker">Time signals // personal ops</p>
          <h2 className="vapor-title text-3xl font-black md:text-5xl">Schedule</h2>
          <p className="vapor-muted mt-2 text-sm">One-time reminders and recurring rhythms, in one agenda.</p>
        </div>
        <span className="vapor-chip w-fit rounded-full px-4 py-2 font-mono text-xs text-cyan-100">{loading ? "Syncing…" : `${upcoming} upcoming · ${entries.length} total`}</span>
      </div>

      <div className="mb-6 flex flex-col gap-4 rounded-2xl border border-fuchsia-300/20 p-4 lg:flex-row lg:items-center lg:justify-between">
        <p className="vapor-muted max-w-xl text-xs leading-relaxed">Notifications run with minute precision, not exact-second delivery. Enable push on this device to receive them. Reminders without push still remain agenda entries.</p>
        <TaskNotifications />
      </div>
      {error && <div role="alert" className="mb-4 rounded-xl border border-amber-300/40 bg-amber-500/10 p-4 text-sm text-amber-200">{error}</div>}
      <p role="status" className="mb-3 text-sm text-cyan-200">{notice}</p>

      {browserZone && <ScheduleCalendar entries={entries} timeZone={browserZone} pending={pending} onEdit={edit} onCreate={(day) => {
        setEditingId(null);
        setForm({ ...newForm(browserZone), startsAt: `${day}T09:00` });
        setFormError("");
        formSection.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        formSection.current?.querySelector("input")?.focus({ preventScroll: true });
      }} />}

      <div className="grid min-w-0 grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(300px,0.8fr)_minmax(0,1.4fr)]">
        <section ref={formSection} aria-labelledby="schedule-form-title" className="vapor-panel min-w-0 rounded-3xl border p-4 sm:p-6">
          <h3 id="schedule-form-title" className="text-sm font-bold uppercase tracking-wider text-fuchsia-100">{editingId === null ? "New reminder" : "Edit reminder"}</h3>
          <p className="vapor-muted mt-2 mb-5 text-xs">Create a single signal or build a repeating routine.</p>
          <form onSubmit={save} className="space-y-4">
            <fieldset disabled={pending} className="min-w-0 space-y-4 disabled:opacity-60">
              <Field label="Title"><input required maxLength={200} value={form.title} onChange={set("title")} placeholder="Time to take a break" className={inputStyle} /></Field>
              <Field label="Notes"><textarea rows={3} maxLength={5000} value={form.notes} onChange={set("notes")} placeholder="Optional details…" className={inputStyle} /></Field>
              <Field label="Repeat"><select value={form.kind} onChange={set("kind")} className={inputStyle}>{Object.entries(kinds).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></Field>
              <Field label={form.kind === "once" ? "Reminder date and time" : "First occurrence / start anchor"}><input required type="datetime-local" step="60" value={form.startsAt} onChange={set("startsAt")} className={inputStyle} /></Field>
              <p className="vapor-muted text-xs leading-relaxed">Start time uses your device&apos;s local time{browserZone ? ` (${browserZone})` : ""} and is saved as an ISO instant. {form.kind === "interval" ? "Intervals are anchored to this first occurrence." : form.kind === "once" ? "This reminder runs once." : "Daily and weekly repeats use this instant’s clock time in the schedule time zone."}</p>
              <Field label="Schedule time zone (IANA)"><input required value={form.timeZone} onChange={set("timeZone")} placeholder="Europe/Zurich" className={inputStyle} spellCheck={false} /></Field>
              <p className="vapor-muted text-xs">Recurrence weekdays and active windows use this time zone.</p>
              {form.kind === "interval" && <Field label="Interval in minutes"><input required type="number" min="1" step="1" value={form.intervalMinutes} onChange={set("intervalMinutes")} className={inputStyle} /></Field>}
              {(form.kind === "weekly" || form.kind === "interval") && (
                <fieldset className="min-w-0">
                  <legend className="mb-2 text-xs font-bold text-cyan-100">Weekdays {form.kind === "weekly" ? "(choose at least one)" : "(optional; none means every day)"}</legend>
                  <div className="flex flex-wrap gap-2">{days.map((day, index) => <label key={day} className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border px-3 text-xs ${form.weekdays.includes(index) ? "border-cyan-200/60 bg-cyan-300/15 text-cyan-100" : "border-violet-300/20 text-violet-100/70"}`}><input type="checkbox" checked={form.weekdays.includes(index)} onChange={() => setForm((current) => ({ ...current, weekdays: current.weekdays.includes(index) ? current.weekdays.filter((value) => value !== index) : [...current.weekdays, index] }))} />{day}</label>)}</div>
                </fieldset>
              )}
              {form.kind === "interval" && <div className="space-y-2"><div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2"><Field label="Active from (optional)"><input type="time" step="60" value={form.activeStart} onChange={set("activeStart")} className={inputStyle} /></Field><Field label="Active until (optional)"><input type="time" step="60" value={form.activeEnd} onChange={set("activeEnd")} className={inputStyle} /></Field></div><p className="vapor-muted text-xs">Set both or neither. Start inclusive, end exclusive; same-day windows only, no overnight windows.</p></div>}
              <label className="flex min-h-11 items-center gap-3 text-sm text-violet-100"><input type="checkbox" checked={form.notifications} onChange={(event) => setForm((current) => ({ ...current, notifications: event.target.checked }))} />Send push notifications for this reminder</label>
              <label className="flex min-h-11 items-center gap-3 text-sm text-violet-100"><input type="checkbox" checked={form.enabled} onChange={(event) => setForm((current) => ({ ...current, enabled: event.target.checked }))} />Schedule enabled</label>
              {formError && <p role="alert" className="text-sm text-amber-200">{formError}</p>}
              <div className="flex flex-wrap gap-2"><button type="submit" className={`${buttonStyle} flex-1 bg-linear-to-r from-fuchsia-500 to-violet-500 text-white`}>{pending ? "Saving…" : editingId === null ? "Create reminder" : "Save changes"}</button>{editingId !== null && <button type="button" onClick={resetForm} className={buttonStyle}>Cancel edit</button>}</div>
            </fieldset>
          </form>
        </section>

        <section aria-labelledby="schedule-agenda-title" className="vapor-panel min-w-0 rounded-3xl border p-4 sm:p-6">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3"><div><h3 id="schedule-agenda-title" className="text-sm font-bold uppercase tracking-wider text-cyan-100">Agenda</h3><p className="vapor-muted mt-2 text-xs">Next occurrences first. Updates every 30 seconds.</p></div><button type="button" disabled={pending || refreshing} onClick={refresh} className={buttonStyle}>{refreshing ? "Refreshing…" : "Refresh"}</button></div>
          <div className="mb-5 flex flex-wrap gap-2" role="group" aria-label="Filter reminders">{["all", "enabled", "paused"].map((value) => <button key={value} type="button" disabled={pending} aria-pressed={filter === value} onClick={() => setFilter(value)} className={`${buttonStyle} capitalize ${filter === value ? "bg-cyan-300/20 text-white" : "text-violet-200/70"}`}>{value}</button>)}</div>
          <div className="space-y-3" aria-busy={loading || pending}>
            {loading ? <p role="status" className="vapor-muted animate-pulse p-6 text-sm">Loading schedule…</p> : visibleEntries.length === 0 ? <div className="vapor-empty rounded-2xl border border-cyan-300/15 p-8 text-center"><p className="text-sm text-fuchsia-100">{error && entries.length === 0 ? "Schedule unavailable." : filter === "all" ? "Your agenda is clear." : "No reminders match this filter."}</p><p className="vapor-muted mt-2 text-xs">{error && entries.length === 0 ? "Use Refresh to try again." : "Add a one-time reminder or a recurring routine to get started."}</p></div> : visibleEntries.map((entry) => <article key={entry.id} className="vapor-list-row min-w-0 rounded-2xl border p-4">
              <div className="flex flex-wrap items-center gap-2"><span className="vapor-chip rounded-full px-2.5 py-1 text-[11px] text-cyan-100">{kinds[entry.kind]}</span><span className={`text-xs ${!entry.enabled ? "text-amber-200" : entry.nextRunAt ? "text-emerald-200" : "text-violet-200/70"}`}>{!entry.enabled ? "Paused" : entry.nextRunAt ? "Enabled" : entry.kind === "once" ? "Completed" : "No upcoming run"}</span><span className="text-xs text-violet-200/65">{entry.notifications ? "Push on" : "Agenda only"}</span></div>
              <h4 className="mt-3 text-base font-semibold wrap-break-word text-fuchsia-50">{entry.title}</h4>
              {entry.notes && <p className="vapor-muted mt-2 whitespace-pre-wrap text-xs leading-relaxed wrap-break-word">{entry.notes}</p>}
              <p className="mt-3 text-xs leading-relaxed wrap-break-word text-cyan-100">{recurrence(entry)}</p>
              <p className="mt-2 text-sm leading-relaxed wrap-break-word text-fuchsia-100"><span className="font-semibold">Next run: </span>{!entry.enabled ? `Paused · ${entry.timeZone}` : formatInstant(entry.nextRunAt, entry.timeZone)}</p>
              <p className="vapor-muted mt-2 text-xs leading-relaxed wrap-break-word">Starts: {formatInstant(entry.startsAt, entry.timeZone)}</p>
              <div className="mt-4 flex flex-wrap gap-2"><button type="button" disabled={pending} onClick={() => edit(entry)} className={buttonStyle} aria-label={`Edit ${entry.title}`}>Edit</button><button type="button" disabled={pending} onClick={() => mutate(entry.id, "PATCH", { enabled: !entry.enabled }, () => setNotice(entry.enabled ? "Reminder paused." : "Reminder resumed."))} className={buttonStyle} aria-label={`${entry.enabled ? "Pause" : "Resume"} ${entry.title}`}>{entry.enabled ? "Pause" : "Resume"}</button><button type="button" disabled={pending} onClick={() => remove(entry)} className={`${buttonStyle} text-pink-200`} aria-label={`Delete ${entry.title}`}>Delete</button></div>
            </article>)}
          </div>
        </section>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  const id = useId();
  return <div className="min-w-0"><label htmlFor={id} className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-cyan-200/80">{label}</label>{cloneElement(children, { id })}</div>;
}
