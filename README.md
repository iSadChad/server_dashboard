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

## Verification

`npm run test:schedule` runs recurrence, validation, PostgreSQL-backed CRUD, and worker tests using an isolated in-memory PGlite database. It does not connect to your server or send real notifications.

`npm run lint` checks code style; `npm run build` verifies the production build. The existing `npm run test:stats` requires a running dashboard (optionally set `STATS_API_URL`).