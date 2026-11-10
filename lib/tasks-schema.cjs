const schemaPromises = new WeakMap();

function ensureTasksTable(db) {
  if (!schemaPromises.has(db)) {
    const pending = (async () => {
      await db.query(`
        CREATE TABLE IF NOT EXISTS tasks (
          id BIGSERIAL PRIMARY KEY,
          title TEXT NOT NULL,
          notes TEXT NOT NULL DEFAULT '',
          category TEXT NOT NULL DEFAULT 'General',
          priority TEXT NOT NULL DEFAULT 'normal',
          due_date DATE NULL,
          status TEXT NOT NULL DEFAULT 'todo',
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          completed_at TIMESTAMPTZ NULL,
          CONSTRAINT tasks_priority_check CHECK (priority IN ('low', 'normal', 'high')),
          CONSTRAINT tasks_status_check CHECK (status IN ('todo', 'done'))
        );
      `);
      await db.query(`
        ALTER TABLE tasks
          ADD COLUMN IF NOT EXISTS due_at TIMESTAMPTZ NULL,
          ADD COLUMN IF NOT EXISTS remind_at TIMESTAMPTZ NULL,
          ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMPTZ NULL;
      `);
    })().catch((error) => {
      schemaPromises.delete(db);
      throw error;
    });
    schemaPromises.set(db, pending);
  }

  return schemaPromises.get(db);
}

module.exports = { ensureTasksTable };
