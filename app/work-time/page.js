"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import PageLayout from "../../components/PageLayout";
import workTime from "../../lib/work-time.cjs";

const { summarize, dayKey } = workTime;
const inputStyle = "vapor-input min-h-11 w-full rounded-xl border border-fuchsia-300/25 bg-violet-950/60 px-3 py-2 text-sm text-white outline-none focus:border-cyan-200";
const buttonStyle = "vapor-button min-h-11 rounded-xl border border-cyan-300/30 px-4 py-2 text-sm font-bold text-cyan-100 disabled:cursor-not-allowed disabled:opacity-40";
const labels = { work: "Work", break: "Lunch / break", doctor: "Doctor", therapy: "Therapy", other: "Other absence", finish: "Finished for today", sick: "Sick leave", school: "School attended", holiday: "Approved holiday", public_holiday: "Public holiday", school_holiday: "School holidays", off: "Weekend" };

function duration(minutes, signed = false) {
  const value = Math.round(Math.abs(minutes || 0));
  const sign = signed ? (minutes < 0 ? "−" : "+") : "";
  return `${sign}${Math.floor(value / 60)}h ${String(value % 60).padStart(2, "0")}m`;
}

function clockDuration(minutes) {
  const seconds = Math.max(0, Math.floor((minutes || 0) * 60));
  return `${String(Math.floor(seconds / 3600)).padStart(2, "0")}:${String(Math.floor(seconds / 60) % 60).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

function displayTime(value, timeZone) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-GB", { timeZone, hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function displayStamp(value, timeZone) {
  return new Intl.DateTimeFormat("en-GB", { timeZone, day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function Card({ label, value, detail, balance = false }) {
  return <div className="vapor-panel rounded-2xl border border-fuchsia-300/20 bg-violet-950/40 p-4">
    <p className="text-xs text-violet-100/60">{label}</p>
    <p className={`mt-2 break-words font-mono text-xl font-bold ${balance ? "text-cyan-200" : "text-white"}`}>{value}</p>
    {detail && <p className="mt-2 text-xs leading-relaxed text-violet-100/50">{detail}</p>}
  </div>;
}

export default function WorkTimePage() {
  return <PageLayout><WorkTimeContent /></PageLayout>;
}

function WorkTimeContent() {
  const [state, setState] = useState(null);
  const [now, setNow] = useState(0);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loading, setLoading] = useState(true);
  const [pending, setPending] = useState(false);
  const [reason, setReason] = useState("break");
  const [period, setPeriod] = useState("week");
  const [event, setEvent] = useState({ kind: "holiday", startDate: "", endDate: "", note: "" });
  const [manual, setManual] = useState({ kind: "work", start: "", end: "" });
  const [arrival, setArrival] = useState("");
  const [settings, setSettings] = useState(null);
  const busy = useRef(false);
  const generation = useRef(0);
  const mounted = useRef(false);
  const offset = useRef(0);

  const accept = useCallback((data) => {
    if (!data?.state || !data.serverNow) throw new Error("Invalid timer response. Please refresh.");
    offset.current = Date.parse(data.serverNow) - Date.now();
    setNow(Date.now() + offset.current);
    setState(data.state);
    setSettings((current) => current || { ...data.state.settings });
    setError("");
  }, []);

  const refresh = useCallback(async () => {
    if (busy.current) return;
    const version = ++generation.current;
    try {
      const response = await fetch("/api/work-time", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Could not load the work timer.");
      if (mounted.current && version === generation.current) accept(data);
    } catch (failure) {
      if (mounted.current && version === generation.current) setError(failure.message);
    } finally {
      if (mounted.current && version === generation.current) setLoading(false);
    }
  }, [accept]);

  useEffect(() => {
    mounted.current = true;
    Promise.resolve().then(() => { if (mounted.current) refresh(); });
    const tick = setInterval(() => setNow(Date.now() + offset.current), 1000);
    const poll = setInterval(refresh, 30000);
    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);
    return () => {
      mounted.current = false;
      generation.current += 1;
      clearInterval(tick);
      clearInterval(poll);
      window.removeEventListener("focus", onFocus);
    };
  }, [refresh]);

  async function mutate(action, payload = {}, success = "Saved.") {
    if (busy.current || !state) return false;
    busy.current = true;
    generation.current += 1;
    setPending(true);
    setError("");
    setNotice("");
    let conflict = false;
    try {
      const response = await fetch("/api/work-time", {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ ...payload, action, version: state.version }),
      });
      const data = await response.json();
      if (!response.ok) {
        conflict = response.status === 409;
        throw new Error(data.message || "Could not save. Please refresh before trying again.");
      }
      if (mounted.current) { accept(data); setNotice(success); }
      return true;
    } catch (failure) {
      if (mounted.current) setError(failure.message);
      return false;
    } finally {
      busy.current = false;
      if (mounted.current) {
        setPending(false);
        if (conflict) {
          setNotice("Reloading the latest state. Check it before trying again.");
          refresh();
        }
      }
    }
  }

  const report = useMemo(() => state && now ? summarize(state, now) : null, [state, now]);
  const today = report?.days.find((day) => day.date === report.today);
  const zone = state?.settings.timeZone || "Europe/Zurich";
  const working = state?.active?.kind === "work";
  const absent = state?.active && !working;
  const totals = report?.[period];
  const recentDays = report?.days.filter((day) => period === "month" ? day.date.slice(0, 7) === report.today.slice(0, 7) : period === "week" ? day.date >= workTime.addDays(report.today, -((new Date(`${report.today}T12:00:00Z`).getUTCDay() + 6) % 7)) : true).slice().reverse();

  function setEventField(key, value) { setEvent((current) => ({ ...current, [key]: value })); }

  async function saveEvent(e) {
    e.preventDefault();
    if (await mutate("add_event", { event: { ...event, endDate: event.endDate || event.startDate } }, "Day entry saved.")) setEvent((current) => ({ ...current, note: "" }));
  }

  async function saveManual(e) {
    e.preventDefault();
    try {
      const start = new Date(manual.start).toISOString();
      const end = new Date(manual.end).toISOString();
      if (await mutate("add_session", { session: { kind: manual.kind, start, end } }, "Session saved.")) setManual((current) => ({ ...current, start: "", end: "" }));
    } catch { setError("Enter valid start and end times."); }
  }

  return <div className="vapor-page work-time-page mx-auto max-w-7xl space-y-6 px-3 py-5 sm:px-5 lg:px-8 lg:py-9">
    <header className="vapor-header rounded-3xl border border-fuchsia-300/25 bg-linear-to-br from-fuchsia-500/15 to-cyan-500/10 p-6">
      <p className="font-mono text-xs uppercase tracking-[0.25em] text-cyan-200/70">Work / school / balance</p>
      <h2 className="mt-2 text-3xl font-black text-white sm:text-4xl">Work timer</h2>
      <p className="mt-3 text-sm text-violet-100/65">8h 24m a day. Your sessions and credits, without losing track.</p>
    </header>
    {error && <div role="alert" className="rounded-xl border border-rose-300/40 bg-rose-950/50 p-4 text-sm text-rose-100">{error} <button className="ml-2 underline" onClick={refresh} disabled={pending}>Refresh</button></div>}
    {notice && <p role="status" className="text-sm text-cyan-100">{notice}</p>}
    {loading && <p role="status" className="p-6 text-violet-100/65">Loading your work time…</p>}
    {state && report && <>
      <section aria-label="Time clock" className="vapor-panel rounded-3xl border border-cyan-300/25 bg-violet-950/45 p-5 sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="font-mono text-xs text-cyan-200">{report.today} · {zone}</p>
          <span className={`rounded-full border px-3 py-1 text-xs ${working ? "border-lime-300/40 text-lime-200" : "border-violet-300/30 text-violet-100/65"}`}>{working ? "Clocked in" : absent ? labels[state.active.kind] : "Clocked out"}</span>
        </div>
        <p className="mt-5 font-mono text-5xl font-black tabular-nums text-white sm:text-7xl" aria-label="Current session elapsed">{clockDuration(report.activeMinutes)}</p>
        <p className="mt-2 text-sm text-violet-100/55">{state.active ? `${labels[state.active.kind]} started ${displayStamp(state.active.start, zone)}` : "Ready when you are. The timer keeps running even with this tab closed."}</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end">
          {working ? <>
            <label className="block sm:max-w-xs sm:flex-1"><span className="mb-2 block text-xs text-violet-100/65">Clock-out reason</span><select aria-label="Clock-out reason" className={inputStyle} value={reason} onChange={(e) => setReason(e.target.value)}>{["break", "doctor", "therapy", "other", "finish", "sick"].map((kind) => <option key={kind} value={kind}>{labels[kind]}</option>)}</select></label>
            <button className={`${buttonStyle} bg-fuchsia-500/20`} disabled={pending} onClick={() => mutate("clock_out", { reason }, "Clocked out.")}>{pending ? "Saving…" : "Clock out"}</button>
          </> : <button className={`${buttonStyle} bg-cyan-400/15 sm:min-w-48`} disabled={pending} onClick={() => mutate("clock_in", {}, "Clocked in.")}>{pending ? "Saving…" : "Clock in"}</button>}
          {absent && <button className={buttonStyle} disabled={pending} onClick={() => mutate("end_absence", {}, "Absence ended. You are still clocked out.")}>End absence without clocking in</button>}
          {today?.type === "school" && <button className={buttonStyle} disabled={pending || today.creditMinutes >= 504} onClick={() => mutate("add_event", { event: { kind: "school", startDate: report.today, endDate: report.today, note: "" } }, "School attendance recorded.")}>Mark school attended</button>}
        </div>
        <p className="mt-4 text-xs leading-relaxed text-violet-100/50">Doctor: up to 1 hour credited per absence. Therapy: all time credited. Other absences: no credit. Choose “Finished for today” to stop without starting a break.</p>
        <details className="mt-5 rounded-xl border border-cyan-300/20 p-4">
          <summary className="cursor-pointer text-sm font-bold text-cyan-100">Forgot to clock in? Set arrival time</summary>
          <form className="mt-4 space-y-3" onSubmit={async (e) => {
            e.preventDefault();
            try {
              const start = new Date(arrival).toISOString();
              if (await mutate("set_clock_in", { start }, "Clock-in time saved. Your timer is running from that time.")) setArrival("");
            } catch { setError("Enter a valid arrival date and time."); }
          }}>
            <label className="block text-xs text-violet-100/65">I arrived today at (this device’s local time)
              <input required type="datetime-local" className={`${inputStyle} mt-2`} value={arrival} onChange={(e) => setArrival(e.target.value)} />
            </label>
            <p className="text-xs leading-relaxed text-violet-100/55">Starts a running work session from your arrival time, or corrects the current clock-in. Only today is allowed, and it cannot overlap a saved session. Record lunch separately. End an active absence first.</p>
            <button className={buttonStyle} disabled={pending || Boolean(absent)}>Set clock-in time</button>
          </form>
        </details>
      </section>
      <section aria-label="Today" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card label="Actual work today" value={duration(today?.workedMinutes)} detail={`Credits: ${duration(today?.creditMinutes)} · ${labels[today?.type] || "Not tracked yet"}`} />
        <Card label="Remaining today" value={duration(today?.remainingMinutes)} detail={today?.balanceMinutes > 0 ? `Overtime: ${duration(today.balanceMinutes)}` : "Daily target: 8h 24m"} />
        <Card label="Estimated finish" value={displayTime(today?.finishAt, zone)} detail="Includes remaining work and the outstanding lunch minimum. Not a promise for unfinished appointments." />
        <Card label="Lunch / break" value={duration(today?.lunchMinutes)} detail={today?.type === "work" ? today.lunchMet ? "30-minute minimum met" : "One continuous 30-minute break required" : "Lunch check applies to workdays"} />
      </section>
      <section className="space-y-4" aria-label="Time balance">
        <div className="flex flex-wrap items-center justify-between gap-3"><h3 className="text-xl font-bold text-white">Your balance</h3><div className="flex flex-wrap gap-2">{["week", "month", "overall"].map((value) => <button key={value} aria-pressed={period === value} className={`${buttonStyle} ${period === value ? "bg-cyan-400/20" : ""}`} onClick={() => setPeriod(value)}>{value === "overall" ? "All time" : `This ${value}`}</button>)}</div></div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Card label="Net balance" value={duration(totals.balanceMinutes, true)} balance detail={period === "overall" ? "Includes your opening balance" : "Overtime minus settled missing time"} />
          <Card label="Overtime earned" value={duration(totals.overtimeMinutes)} />
          <Card label="Missing time" value={duration(totals.missingMinutes)} detail="Today’s unfinished target is not missing time yet." />
          <Card label="Work + credits" value={duration(totals.workedMinutes + totals.creditMinutes)} detail={`Expected to date: ${duration(totals.expectedMinutes)}`} />
        </div>
        <details className="vapor-panel rounded-2xl border border-violet-300/20 p-4"><summary className="cursor-pointer text-sm font-bold text-cyan-100">Daily breakdown</summary><div className="mt-4 max-h-96 overflow-auto"><table className="w-full whitespace-nowrap text-left text-xs"><thead className="text-violet-100/60"><tr>{["Date", "Day", "Worked", "Credits", "Balance"].map((label) => <th key={label} className="p-2">{label}</th>)}</tr></thead><tbody>{recentDays.map((day) => <tr key={day.date} className="border-t border-violet-300/10"><td className="p-2">{day.date}</td><td className="p-2">{labels[day.type]}</td><td className="p-2">{duration(day.workedMinutes)}</td><td className="p-2">{duration(day.creditMinutes)}</td><td className="p-2">{day.date === report.today && day.balanceMinutes < 0 ? `${duration(day.remainingMinutes)} remaining` : duration(day.balanceMinutes, true)}</td></tr>)}</tbody></table></div></details>
      </section>
      <section aria-label="Monthly attendance" className="space-y-4">
        <h3 className="text-xl font-bold text-white">Monthly attendance · {report.attendance.month}</h3>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Card label="Attendance to date" value={report.attendance.percentToDate === null ? "—" : `${report.attendance.percentToDate.toFixed(1)}%`} detail="Actual work + confirmed school, compared with weekdays through today. Today is included in full." />
          <Card label="Full-month progress" value={report.attendance.percentOfMonth === null ? "—" : `${report.attendance.percentOfMonth.toFixed(1)}%`} detail={report.attendance.targetMet ? "Monthly 90% target reached" : "Target: at least 90% by month-end"} />
          <Card label="Attendance recorded" value={duration(report.attendance.attendedMinutes)} detail={`90% target: ${duration(report.attendance.targetMinutes)}`} />
          <Card label="Still needed for 90%" value={duration(Math.ceil(report.attendance.remainingMinutes))} detail="Includes the attendance still needed during the rest of this month." />
        </div>
        <p className="text-xs leading-relaxed text-violet-100/60">Workplace time and confirmed school count; extra work can make up attendance. Therapy, doctor visits, sickness, leave and public holidays do not add attendance or reduce the weekday target. This is separate from your credited work balance. Calculated from {report.attendance.startDate}; dates before your tracking start are excluded. Percentages can exceed 100%.</p>
      </section>
      <section aria-label="Holiday allowance" className="vapor-panel rounded-3xl border border-fuchsia-300/20 p-5">
        <h3 className="text-xl font-bold text-white">Holidays · {report.leave.year}</h3>
        <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4"><Card label="Annual allowance" value={`${report.leave.allowanceDays} days`} detail="6 weeks on a five-day week" /><Card label="Taken" value={`${report.leave.usedDays} days`} /><Card label="Approved upcoming" value={`${report.leave.plannedDays} days`} /><Card label="Remaining to book" value={`${report.leave.remainingDays} days`} /></div>
        <p className="mt-4 text-sm text-violet-100/65">{report.leave.twoWeekBlock ? "Two-week consecutive holiday block is booked / taken." : "Still to book: one consecutive two-week holiday block this year."} Only enter approved leave. Public holidays do not use your allowance.</p>
      </section>
      <section className="grid items-start gap-5 lg:grid-cols-2">
        <form onSubmit={saveEvent} className="vapor-panel space-y-4 rounded-3xl border border-fuchsia-300/20 p-5">
          <h3 className="text-xl font-bold text-white">School, leave & sick days</h3>
          <label className="block text-xs text-violet-100/65">Type<select className={`${inputStyle} mt-2`} value={event.kind} onChange={(e) => setEventField("kind", e.target.value)}>{["holiday", "school", "sick", "public_holiday", "school_holiday"].map((kind) => <option key={kind} value={kind}>{labels[kind]}</option>)}</select></label>
          <div className="grid grid-cols-2 gap-3"><label className="text-xs text-violet-100/65">From<input required type="date" className={`${inputStyle} mt-2`} value={event.startDate} onChange={(e) => setEventField("startDate", e.target.value)} /></label><label className="text-xs text-violet-100/65">Through (inclusive)<input type="date" min={event.startDate} className={`${inputStyle} mt-2`} value={event.endDate} onChange={(e) => setEventField("endDate", e.target.value)} /></label></div>
          <label className="block text-xs text-violet-100/65">Note (optional)<input maxLength={300} className={`${inputStyle} mt-2`} value={event.note} onChange={(e) => setEventField("note", e.target.value)} /></label>
          <p className="text-xs leading-relaxed text-violet-100/50">A blank end date means one day. School holidays make Thursday/Friday workdays; they are not personal leave. Full sick days excuse the target. For leaving early, use the “Sick leave” clock-out reason. Public holidays are entered manually.</p>
          <button disabled={pending} className={buttonStyle}>Save day entry</button>
        </form>
        <div className="space-y-4">
          <details className="vapor-panel rounded-3xl border border-violet-300/20 p-5"><summary className="cursor-pointer font-bold text-cyan-100">Correct a forgotten session</summary><form className="mt-4 space-y-3" onSubmit={saveManual}><p className="text-xs text-violet-100/55">Enter past start/end times in this device’s local timezone. Overlapping sessions are rejected. Delete an incorrect session below before replacing it.</p><label className="block text-xs">Session type<select className={`${inputStyle} mt-2`} value={manual.kind} onChange={(e) => setManual({ ...manual, kind: e.target.value })}>{["work", "break", "doctor", "therapy", "other"].map((kind) => <option key={kind} value={kind}>{labels[kind]}</option>)}</select></label><label className="block text-xs">Start<input required type="datetime-local" className={`${inputStyle} mt-2`} value={manual.start} onChange={(e) => setManual({ ...manual, start: e.target.value })} /></label><label className="block text-xs">End<input required type="datetime-local" className={`${inputStyle} mt-2`} value={manual.end} onChange={(e) => setManual({ ...manual, end: e.target.value })} /></label><button disabled={pending} className={buttonStyle}>Add past session</button></form></details>
          <details className="vapor-panel rounded-3xl border border-violet-300/20 p-5"><summary className="cursor-pointer font-bold text-cyan-100">Tracker settings</summary><form className="mt-4 space-y-3" onSubmit={async (e) => { e.preventDefault(); await mutate("configure", { settings: { ...settings, openingBalanceMinutes: Number(settings.openingBalanceMinutes) } }, "Settings saved."); }}><p className="text-xs text-violet-100/55">Missing hours start at this date, never before it. Default timezone: Europe/Zurich. Changing timezone recalculates day boundaries. Opening balance is signed minutes: positive for overtime, negative for time owed.</p><label className="block text-xs">Tracking starts<input required type="date" className={`${inputStyle} mt-2`} value={settings.startDate} onChange={(e) => setSettings({ ...settings, startDate: e.target.value })} /></label><label className="block text-xs">Timezone<input required className={`${inputStyle} mt-2`} value={settings.timeZone} onChange={(e) => setSettings({ ...settings, timeZone: e.target.value })} /></label><label className="block text-xs">Opening balance (minutes)<input required type="number" step="1" className={`${inputStyle} mt-2`} value={settings.openingBalanceMinutes} onChange={(e) => setSettings({ ...settings, openingBalanceMinutes: e.target.value })} /></label><button disabled={pending} className={buttonStyle}>Save settings</button></form></details>
        </div>
      </section>
      <section className="grid items-start gap-5 lg:grid-cols-2">
        <details className="vapor-panel rounded-3xl border border-violet-300/20 p-5"><summary className="cursor-pointer font-bold text-cyan-100">Recorded sessions ({state.sessions.length})</summary><ul className="mt-4 max-h-96 space-y-3 overflow-y-auto">{state.sessions.slice().sort((a, b) => b.start.localeCompare(a.start)).map((session) => <li key={session.id} className="flex items-center justify-between gap-3 border-t border-violet-300/15 pt-3 text-xs"><div><p className="font-bold text-white">{labels[session.kind]} · {duration((Date.parse(session.end) - Date.parse(session.start)) / 60000)}</p><p className="mt-1 text-violet-100/55">{displayStamp(session.start, zone)} → {displayStamp(session.end, zone)}</p></div><button className={buttonStyle} disabled={pending} aria-label={`Delete ${labels[session.kind]} session`} onClick={() => { if (window.confirm("Delete this recorded session? Its time and credits will be removed.")) mutate("delete_session", { id: session.id }, "Session deleted."); }}>Delete</button></li>)}</ul>{!state.sessions.length && <p className="mt-4 text-sm text-violet-100/50">No completed sessions yet.</p>}</details>
        <details className="vapor-panel rounded-3xl border border-violet-300/20 p-5"><summary className="cursor-pointer font-bold text-cyan-100">School & absence entries ({state.events.length})</summary><ul className="mt-4 max-h-96 space-y-3 overflow-y-auto">{state.events.slice().sort((a, b) => b.startDate.localeCompare(a.startDate)).map((entry) => <li key={entry.id} className="flex items-center justify-between gap-3 border-t border-violet-300/15 pt-3 text-xs"><div><p className="font-bold text-white">{labels[entry.kind]}</p><p className="mt-1 text-violet-100/55">{entry.startDate} → {entry.endDate}</p>{entry.note && <p className="mt-1 break-words text-violet-100/65">{entry.note}</p>}</div><button className={buttonStyle} disabled={pending} aria-label={`Delete ${labels[entry.kind]} entry`} onClick={() => { if (window.confirm("Delete this day entry? Your balance and allowance will be recalculated.")) mutate("delete_event", { id: entry.id }, "Day entry deleted."); }}>Delete</button></li>)}</ul></details>
      </section>
      <p className="pb-5 text-xs leading-relaxed text-violet-100/45">One personal tracker, shared across your devices. Sessions use server timestamps; the running display catches up after sleep or refresh. Normal workdays: Monday–Wednesday. Thursday/Friday require school attendance unless school holidays are entered. Weekends have no target. Current-day shortfall only enters the balance after the day ends. Tracking today: {dayKey(now, zone)}.</p>
    </>}
  </div>;
}
