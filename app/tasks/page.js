"use client";

import { useEffect, useMemo, useState } from "react";
import PageLayout from "../../components/PageLayout";

const emptyForm = {
  title: "",
  notes: "",
  category: "General",
  priority: "normal",
  dueAt: "",
  remindAt: "",
};

const priorityStyles = {
  low: "text-cyan-100/55 bg-cyan-400/5 border-cyan-300/15",
  normal: "text-fuchsia-100 bg-fuchsia-400/10 border-fuchsia-300/20",
  high: "text-amber-300 bg-amber-500/10 border-amber-500/20",
};

function formatDateTime(value) {
  if (!value) return "No due date";

  try {
    return new Date(value).toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return value;
  }
}
function isOverdue(task) {
  if (!task.dueAt || task.status === "done") {
    return false;
  }

  return new Date(task.dueAt) < new Date();
}

async function requestTasks() {
  const response = await fetch("/api/tasks", {
    cache: "no-store",
  });

  return response.json();
}

export default function TasksPage() {
  return (
    <PageLayout>
      <TasksContent />
    </PageLayout>
  );
}

function TasksContent() {
  const [tasks, setTasks] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [filter, setFilter] = useState("open");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;

    requestTasks()
      .then((data) => {
        if (!cancelled && data.tasks) {
          setTasks(data.tasks);
        }
      })
      .catch((error) => {
        console.error("Failed to fetch tasks:", error);
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function createTask(event) {
    event.preventDefault();

    if (!form.title.trim()) return;

    setSaving(true);

    if (
      form.dueAt &&
      form.remindAt &&
      new Date(form.remindAt) > new Date(form.dueAt)
      ) {
        window.alert("The reminder cannot be after the due date.");
        setSaving(false);
        return;
      }

const payload = {
  ...form,
  dueAt: form.dueAt
    ? new Date(form.dueAt).toISOString()
    : null,
  remindAt: form.remindAt
    ? new Date(form.remindAt).toISOString()
    : null,
};

    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.task) {
        setTasks((current) => [data.task, ...current]);
        setForm(emptyForm);
      }
    } catch (error) {
      console.error("Failed to create task:", error);
    } finally {
      setSaving(false);
    }
  }

  async function updateTask(id, updates) {
    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      });

      const data = await response.json();

      if (data.task) {
        setTasks((current) =>
          current.map((task) => (task.id === id ? data.task : task))
        );
      }
    } catch (error) {
      console.error("Failed to update task:", error);
    }
  }

  async function deleteTask(id) {
    const confirmed = window.confirm("Delete this task?");

    if (!confirmed) return;

    try {
      const response = await fetch(`/api/tasks/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.status === "ok") {
        setTasks((current) => current.filter((task) => task.id !== id));
      }
    } catch (error) {
      console.error("Failed to delete task:", error);
    }
  }

  const stats = useMemo(() => {
    const open = tasks.filter((task) => task.status === "todo").length;
    const done = tasks.filter((task) => task.status === "done").length;
    const overdue = tasks.filter(isOverdue).length;

    return { open, done, overdue, total: tasks.length };
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    if (filter === "done") {
      return tasks.filter((task) => task.status === "done");
    }

    if (filter === "all") {
      return tasks;
    }

    return tasks.filter((task) => task.status === "todo");
  }, [tasks, filter]);

  return (
    <div className="vapor-page tasks-workbench p-3 sm:p-4 lg:p-8">
      <div className="vapor-header page-command-header relative mb-6 flex flex-col gap-4 overflow-hidden rounded-3xl border border-fuchsia-300/20 bg-linear-to-br from-fuchsia-500/15 via-violet-500/10 to-cyan-400/10 px-5 py-6 shadow-[0_0_55px_rgba(217,70,239,0.14)] sm:flex-row sm:items-end sm:justify-between md:mb-8 md:px-7 md:py-8">
        <div>
          <p className="vapor-kicker mb-2 font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-cyan-300/75">
            Mission queue // personal ops
          </p>
          <h2 className="vapor-title text-3xl font-black tracking-tight text-white md:text-5xl">Tasks</h2>
          <p className="vapor-muted mt-2 text-sm text-violet-100/55">
            Capture, prioritize and clear the queue
          </p>
        </div>

        <div className="vapor-chip flex items-center gap-2 rounded-full border border-cyan-300/25 bg-cyan-300/10 px-4 py-2.5 font-mono text-xs uppercase tracking-wider text-cyan-100">
          <div className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(103,232,249,0.85)]" />
          <span>{loading ? "Loading..." : `${stats.open} open tasks`}</span>
        </div>
      </div>

      <div className="task-meter-grid mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3 md:mb-8 md:gap-4">
        <StatCard label="Open" value={stats.open} />
        <StatCard label="Overdue" value={stats.overdue} warning={stats.overdue > 0} />
        <StatCard label="Done" value={stats.done} />
      </div>

      <div className="task-board grid grid-cols-1 gap-4 xl:grid-cols-[380px_1fr] 2xl:grid-cols-[430px_1fr]">
        <section className="vapor-panel h-fit rounded-3xl border border-fuchsia-300/20 bg-violet-950/35 p-5 shadow-[0_24px_70px_rgba(30,0,65,0.28)] backdrop-blur-xl md:p-6 xl:sticky xl:top-6">
          <h3 className="mb-1 text-sm font-bold uppercase tracking-wider text-fuchsia-100">
            Add Task
          </h3>
          <p className="vapor-muted mb-5 text-[11px] text-violet-100/45">
            Quick capture for school, server, work and life admin.
          </p>

          <form onSubmit={createTask} className="vapor-form space-y-3">
            <Field label="Title">
              <input
                value={form.title}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    title: event.target.value,
                  }))
                }
                placeholder="What needs doing?"
                className="vapor-input w-full rounded-xl border border-fuchsia-300/15 bg-violet-950/60 px-3 py-3 text-sm text-fuchsia-50 outline-none transition-all placeholder:text-violet-200/25 focus:border-cyan-300/50 focus:shadow-[0_0_20px_rgba(34,211,238,0.1)]"
              />
            </Field>

            <Field label="Notes">
              <textarea
                value={form.notes}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    notes: event.target.value,
                  }))
                }
                placeholder="Optional details..."
                rows={3}
                className="vapor-input w-full resize-none rounded-xl border border-fuchsia-300/15 bg-violet-950/60 px-3 py-3 text-sm text-fuchsia-50 outline-none transition-all placeholder:text-violet-200/25 focus:border-cyan-300/50 focus:shadow-[0_0_20px_rgba(34,211,238,0.1)]"
              />
            </Field>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Category">
                <input
                  value={form.category}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      category: event.target.value,
                    }))
                  }
                  placeholder="General"
                  className="vapor-input w-full rounded-xl border border-fuchsia-300/15 bg-violet-950/60 px-3 py-3 text-sm text-fuchsia-50 outline-none transition-all placeholder:text-violet-200/25 focus:border-cyan-300/50"
                />
              </Field>

              <Field label="Priority">
                <select
                  value={form.priority}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      priority: event.target.value,
                    }))
                  }
                  className="vapor-input w-full rounded-xl border border-fuchsia-300/15 bg-violet-950/60 px-3 py-3 text-sm text-fuchsia-50 outline-none transition-all focus:border-cyan-300/50"
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                </select>
              </Field>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Due date and time">
              <input
                type="datetime-local"
                value={form.dueAt}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    dueAt: event.target.value,
                  }))
                }
                className="vapor-input w-full rounded-xl border border-fuchsia-300/15 bg-violet-950/60 px-3 py-3 text-sm text-fuchsia-50 outline-none transition-all focus:border-cyan-300/50"
              />
            </Field>

            <Field label="Remind me at">
              <input
                type="datetime-local"
                value={form.remindAt}
                max={form.dueAt || undefined}
                disabled={!form.dueAt}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    remindAt: event.target.value,
                  }))
                }
                className="vapor-input w-full rounded-xl border border-fuchsia-300/15 bg-violet-950/60 px-3 py-3 text-sm text-fuchsia-50 outline-none transition-all focus:border-cyan-300/50 disabled:cursor-not-allowed disabled:opacity-40"
              />
            </Field>
          </div>

            <button
              type="submit"
              disabled={saving || !form.title.trim()}
              className="vapor-button w-full rounded-xl border border-fuchsia-200/35 bg-linear-to-r from-fuchsia-500 to-violet-500 px-3 py-3 text-sm font-bold uppercase tracking-wider text-white shadow-[0_0_28px_rgba(217,70,239,0.24)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_34px_rgba(34,211,238,0.25)] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Adding..." : "Add Task"}
            </button>
          </form>
        </section>

        <section className="vapor-panel min-w-0 rounded-3xl border border-cyan-300/20 bg-violet-950/30 p-5 shadow-[0_24px_70px_rgba(30,0,65,0.25)] backdrop-blur-xl md:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-100">
                Task List
              </h3>
              <p className="vapor-muted mt-1 text-[11px] text-violet-100/45">
                Filter and complete tasks directly here.
              </p>
            </div>

            <div className="vapor-tabs flex rounded-xl border border-fuchsia-300/15 bg-violet-950/60 p-1">
              {["open", "all", "done"].map((item) => (
                <button
                  key={item}
                  onClick={() => setFilter(item)}
                  className={`rounded-lg px-3 py-2 text-xs font-bold capitalize transition-all ${
                    filter === item
                      ? "bg-linear-to-r from-fuchsia-500/35 to-cyan-400/20 text-white shadow-[0_0_16px_rgba(217,70,239,0.18)]"
                      : "text-violet-100/40 hover:text-cyan-100"
                  }`}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            {loading ? (
              <>
                <TaskSkeleton />
                <TaskSkeleton />
                <TaskSkeleton />
              </>
            ) : filteredTasks.length > 0 ? (
              filteredTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onToggle={() =>
                    updateTask(task.id, {
                      status: task.status === "done" ? "todo" : "done",
                    })
                  }
                  onDelete={() => deleteTask(task.id)}
                />
              ))
            ) : (
              <div className="vapor-empty rounded-2xl border border-fuchsia-300/15 bg-violet-950/50 p-8 text-center">
                <p className="text-sm text-violet-100/50">
                  No tasks here yet.
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

function StatCard({ label, value, warning = false }) {
  return (
    <div
      className={`vapor-card min-w-0 rounded-3xl border bg-linear-to-br from-fuchsia-500/10 to-cyan-400/5 p-4 shadow-[0_18px_45px_rgba(30,0,70,0.2)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 sm:p-5 ${
        warning ? "border-amber-400/30" : "border-fuchsia-300/20 hover:border-cyan-200/35"
      }`}
    >
      <p className="vapor-kicker mb-2 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-cyan-200/55">{label}</p>
      <p className={`text-3xl font-black ${warning ? "text-amber-300" : "text-fuchsia-50"}`}>
        {value}
      </p>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="vapor-kicker mb-1.5 block text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-200/50">
        {label}
      </span>
      {children}
    </label>
  );
}

function TaskCard({ task, onToggle, onDelete }) {
  const overdue = isOverdue(task);
  const priorityStyle = priorityStyles[task.priority] || priorityStyles.normal;

  return (
    <article
      className={`vapor-list-row group min-w-0 rounded-2xl border bg-linear-to-r from-violet-950/65 to-fuchsia-950/35 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:bg-fuchsia-400/8 ${
        overdue ? "border-amber-400/30" : "border-fuchsia-300/15 hover:border-cyan-200/30"
      }`}
    >
      <div className="flex items-start gap-3">
        <button
          onClick={onToggle}
          className={`mt-0.5 h-5 w-5 rounded-full border shrink-0 flex items-center justify-center transition-all ${
            task.status === "done"
              ? "bg-emerald-500/20 border-emerald-500/40"
              : "border-fuchsia-300/35 hover:border-cyan-300/70"
          }`}
          aria-label={task.status === "done" ? "Reopen task" : "Complete task"}
        >
          {task.status === "done" && (
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
          )}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
            <div className="min-w-0">
              <h4
                className={`text-sm font-semibold wrap-break-word ${
                  task.status === "done"
                    ? "text-violet-100/30 line-through"
                    : "text-fuchsia-50"
                }`}
              >
                {task.title}
              </h4>

              {task.notes && (
                <p className="vapor-muted mt-1 whitespace-pre-wrap wrap-break-word text-xs text-violet-100/45">
                  {task.notes}
                </p>
              )}
            </div>

            <button
              onClick={onDelete}
              className="vapor-button self-start rounded-lg border border-pink-300/15 bg-pink-400/5 px-2.5 py-1.5 text-[11px] text-pink-200/65 transition-all hover:border-pink-300/35 hover:bg-pink-400/15"
            >
              Delete
            </button>
          </div>

          <div className="flex flex-wrap gap-2 mt-3">
            <span className="vapor-chip rounded-full border border-cyan-300/15 bg-cyan-400/5 px-2.5 py-1 text-[11px] text-cyan-100/55">
              {task.category}
            </span>

            <span
              className={`rounded-full border px-2.5 py-1 text-[11px] ${priorityStyle}`}
            >
              {task.priority}
            </span>

            <span
              className={`rounded-full border px-2.5 py-1 text-[11px] ${
                overdue
                  ? "text-amber-300 bg-amber-500/10 border-amber-500/20"
                  : "text-violet-100/50 bg-violet-400/5 border-violet-300/15"
              }`}
            >
              {overdue ? "Overdue · " : ""}
              {formatDateTime(task.dueAt)}
              {task.remindAt && (
              <span className="rounded-full border border-cyan-300/15 bg-cyan-400/5 px-2.5 py-1 text-[11px] text-cyan-100/55">
                Reminder · {formatDateTime(task.remindAt)}
              </span>
            )}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}

function TaskSkeleton() {
  return (
    <div className="vapor-list-row animate-pulse rounded-2xl border border-fuchsia-300/15 bg-violet-950/50 p-4">
      <div className="mb-3 h-4 w-2/3 rounded bg-fuchsia-400/10" />
      <div className="mb-4 h-3 w-1/2 rounded bg-cyan-400/5" />
      <div className="flex gap-2">
        <div className="h-6 w-20 rounded-full bg-fuchsia-400/5" />
        <div className="h-6 w-20 rounded-full bg-cyan-400/5" />
      </div>
    </div>
  );
}
