# server_dashboard

Private Next.js server dashboard with monitoring, files, databases, tasks, notes, and a Schedule agenda.

## Schedule

Open **Schedule** in the sidebar to create one-time, interval, daily, or weekly entries. Entries can be edited, paused/resumed, or deleted. Interval entries support selected weekdays and optional same-day active hours (start inclusive, end exclusive). For example: “Take a five-minute break”, every 60 minutes, weekdays, 09:00–17:00.

The selected timezone controls weekdays and active hours. Daily/weekly entries keep their local clock time across daylight-saving changes. A nonexistent spring-forward time is skipped; a repeated fall-back time runs once. The start-date input uses your device's local timezone; the agenda displays each entry in its saved timezone.

The calendar offers **Month** and **Week** views, previous/next navigation, and a Today button. Select a month date to see its occurrences and add a reminder; click an occurrence to edit the underlying reminder series. Weekly columns show times in chronological order and scroll horizontally on small screens. The agenda remains below for managing paused reminders. Calendar times use your device timezone. Recurring dates are projections of current rules, not delivery history; paused entries are hidden, month cells preview up to three occurrences, and day lists show up to 200.

### Storage and notifications

- Schedule uses the existing `TASKS_DATABASE_URL`. Its `schedule_entries` table is created automatically by the API or reminder worker; no separate database is needed.
- Enable notifications on the Schedule page to reuse the existing device push subscription. Push reminders require HTTPS (or localhost), notification permission, and the existing VAPID configuration. On iOS, open the installed home-screen PWA.
- The existing `scripts/task-reminder-worker.cjs` now processes both task and schedule reminders. Restart that worker after deploying this change. If it is not already managed by PM2, start it from the project directory with `pm2 start scripts/task-reminder-worker.cjs --name task-reminder-worker`, then `pm2 save`. Do not start a second copy under a different name.
- The worker checks once a minute, so delivery is not exact to the second. No browser tab needs to stay open. Notifications go to all registered devices, like task reminders.
- Recurring occurrences over five minutes old are skipped and advanced to avoid catch-up spam after downtime. One-time reminders are retried until a device accepts delivery. Failed recurring delivery is retried within that five-minute window. Push acceptance does not guarantee the device displayed the notification.
- Entries with push disabled still advance in the agenda when the worker runs. Paused entries do not run. This is a reminder scheduler, not an automatic five-minute break timer.

## Task storage and metric history

Task API routes and the reminder worker initialize the same task schema, including due timestamps and reminder fields. Existing tables receive missing columns without deleting tasks or legacy date values. The task list sorts by the current due timestamp.

Each `/api/chart` request records a server metric sample before returning the historical charts. The dashboard polls this endpoint once a minute while open; this is not a background collector, so no samples are recorded while no clients are polling it.

## Work timer

Open **Work timer** in the sidebar or Tools. Clock in to start; clock out with a reason (lunch/break, doctor, therapy, other absence, finished, or sick). Clocking back in closes the absence. Sessions keep their server timestamps across reloads and devices. This is one shared personal tracker, using its own PostgreSQL connection, `WORK_TIME_DATABASE_URL`. Create a dedicated database and configure that server-side environment variable before using the timer; its `work_time_state` table is created automatically. It does not fall back to the tasks database. No extra worker or service is required.

- Monday–Wednesday are workdays, with a target of 8h 24m. Thursday/Friday require school attendance confirmation for the daily credit. School-holiday ranges turn those days into workdays. Weekends have no target.
- Lunch defaults to one uninterrupted 30-minute **lunch/break** session; shorter breaks are not combined. All break time is unpaid. Longer lunch moves the finish estimate later. Doctor/therapy absences are not counted as lunch. The check warns rather than blocking clock-in.
- Doctor absences credit up to one hour per appointment; therapy credits the whole recorded absence. Other absences have no credit. Credit is never added in advance of elapsed time.
- Mark full sick days with a day entry, or clock out as sick to excuse the remainder. School, sickness, personal leave and public-holiday day credits fill the remaining daily target, not generate artificial overtime.
- Weekly, monthly and all-time summaries separate actual work, credits, overtime and missing time. Today shows remaining hours rather than settled missing time. Future dates never create deficits. Tracking begins on the configured start date (initially today); set an opening balance in signed minutes to bring older balances forward.
- Annual leave is 30 weekdays (six five-day weeks). Enter only approved holidays, as ranges or individual days. Public holidays are entered manually and do not consume leave; no regional calendar is assumed. The yearly consecutive-leave check looks for two full workweeks covered by approved leave/public holidays. School holidays do not consume personal leave.
- Use recorded sessions/day entries to delete mistakes, and **Correct a forgotten session** to enter replacement past sessions. Manual datetime inputs use your device timezone; reports use the configured tracker timezone (initially Europe/Zurich).
- Forgot today's clock-in? **Set arrival time** starts a running session from the time you arrived, or changes the current work session's start. It accepts today's past times only and rejects overlaps with saved sessions. End an active absence first; lunch still needs its own recorded break.

## Verification

`npm run test:schedule` runs recurrence, validation, PostgreSQL-backed CRUD, and worker tests using an isolated in-memory PGlite database. It does not connect to your server or send real notifications.

`npm run test:dashboard` tests task CRUD on fresh and legacy databases, due-time ordering, and chart sample persistence using isolated PGlite databases. These tests use Node.js 24's module hooks to execute the chart route's Next.js-style imports.

`npm run lint` checks code style; `npm run build` verifies the production build. The existing `npm run test:stats` requires a running dashboard (optionally set `STATS_API_URL`).