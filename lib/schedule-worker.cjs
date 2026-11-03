const { nextOccurrence } = require("./schedule.cjs");

async function scanScheduleReminders(pool, sendPush, now = new Date()) {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const { rows } = await client.query(`
      SELECT * FROM schedule_entries
      WHERE definition->>'enabled' = 'true' AND next_run_at <= $1
      ORDER BY next_run_at, id LIMIT 25 FOR UPDATE SKIP LOCKED
    `, [now]);
    const subscriptions = rows.some((row) => row.definition.notifications)
      ? (await client.query("SELECT endpoint, p256dh, auth FROM push_subscriptions")).rows
      : [];
    for (const row of rows) {
      const entry = row.definition;
      const stale = entry.kind !== "once" && now - new Date(row.next_run_at) > 5 * 60_000;
      if (entry.notifications && !stale) {
        let delivered = false;
        for (const subscription of subscriptions) {
          const sent = await sendPush(subscription, {
            title: "Schedule Reminder", body: entry.title + (entry.notes ? ` · ${entry.notes}` : ""),
            url: "/schedule", tag: `schedule-${row.id}-${new Date(row.next_run_at).getTime()}`,
          });
          delivered = Boolean(sent) || delivered;
        }
        if (!delivered) continue;
      }
      await client.query(`
        UPDATE schedule_entries SET next_run_at = $1, last_run_at = $2, updated_at = clock_timestamp()
        WHERE id = $3
      `, [nextOccurrence(entry, now), stale ? row.last_run_at : now, row.id]);
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

module.exports = { scanScheduleReminders };
