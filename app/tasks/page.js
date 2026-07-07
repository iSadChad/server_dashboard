"use client";

import { useEffect, useMemo, useState } from "react";
import PageLayout from "../../components/PageLayout";

const emptyForm = {
  title: "",
  notes: "",
  category: "General",
  priority: "normal",
  dueDate: "",
};

const priorityStyles = {
  low: "text-red-200/50 bg-red-500/5 border-red-500/10",
  normal: "text-red-200 bg-red-500/10 border-red-500/20",
  high: "text-amber-300 bg-amber-500/10 border-amber-500/20",
};

function formatDate(value) {
  if (!value) return "No due date";

  try {
    return new Date(`${value}T00:00:00`).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return value;
  }
}

function isOverdue(task) {
  if (!task.dueDate || task.status === "done") return false;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const due = new Date(`${task.dueDate}T00:00:00`);
  due.setHours(0, 0, 0, 0);

  return due < today;
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

  async function fetchTasks() {
    try {
      const response = await fetch("/api/tasks", {
        cache: "no-store",
      });

      const data = await response.json();

      if (data.tasks) {
        setTasks(data.tasks);
      }
    } catch (error) {
      console.error("Failed to fetch tasks:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchTasks();
  }, []);

  async function createTask(event) {
    event.preventDefault();

    if (!form.title.trim()) return;

    setSaving(true);

    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
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
    <div className="p-3 sm:p-4 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 md:mb-8">
        <div>
          <h2 className="text-xl md:text-2xl font-bold">Tasks</h2>
          <p className="text-red-200/40 text-sm mt-1">
            Native task tracker inside Chad&apos;s Goon Cave
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-red-200/40 font-mono bg-[#111111] rounded-lg px-3 py-2 border border-red-500/10">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <span>{loading ? "Loading..." : `${stats.open} open tasks`}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mb-6 md:mb-8">
        <StatCard label="Open" value={stats.open} />
        <StatCard label="Overdue" value={stats.overdue} warning={stats.overdue > 0} />
        <StatCard label="Done" value={stats.done} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[420px_1fr] gap-3 md:gap-4">
        <section className="rounded-2xl bg-white/[0.03] backdrop-blur-sm border border-red-500/10 p-4 md:p-6 h-fit">
          <h3 className="text-sm font-semibold text-red-200/70 mb-1">
            Add Task
          </h3>
          <p className="text-[11px] text-red-300/30 mb-4">
            Quick capture for school, server, work and life admin.
          </p>

          <form onSubmit={createTask} className="space-y-3">
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
                className="w-full rounded-lg bg-[#111111] border border-red-500/10 px-3 py-3 text-sm text-red-100 outline-none focus:border-red-500/40"
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
                className="w-full rounded-lg bg-[#111111] border border-red-500/10 px-3 py-3 text-sm text-red-100 outline-none focus:border-red-500/40 resize-none"
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
                  className="w-full rounded-lg bg-[#111111] border border-red-500/10 px-3 py-3 text-sm text-red-100 outline-none focus:border-red-500/40"
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
                  className="w-full rounded-lg bg-[#111111] border border-red-500/10 px-3 py-3 text-sm text-red-100 outline-none focus:border-red-500/40"
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                </select>
              </Field>
            </div>

            <Field label="Due date">
              <input
                type="date"
                value={form.dueDate}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    dueDate: event.target.value,
                  }))
                }
                className="w-full rounded-lg bg-[#111111] border border-red-500/10 px-3 py-3 text-sm text-red-100 outline-none focus:border-red-500/40"
              />
            </Field>

            <button
              type="submit"
              disabled={saving || !form.title.trim()}
              className="w-full rounded-lg bg-red-500/10 hover:bg-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed border border-red-500/20 text-red-300 px-3 py-3 text-sm font-medium transition-all"
            >
              {saving ? "Adding..." : "Add Task"}
            </button>
          </form>
        </section>

        <section className="rounded-2xl bg-white/[0.03] backdrop-blur-sm border border-red-500/10 p-4 md:p-6 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div>
              <h3 className="text-sm font-semibold text-red-200/70">
                Task List
              </h3>
              <p className="text-[11px] text-red-300/30 mt-1">
                Filter and complete tasks directly here.
              </p>
            </div>

            <div className="flex rounded-lg bg-[#111111] border border-red-500/10 p-1">
              {["open", "all", "done"].map((item) => (
                <button
                  key={item}
                  onClick={() => setFilter(item)}
                  className={`px-3 py-2 rounded-md text-xs font-medium capitalize transition-all ${
                    filter === item
                      ? "bg-red-500/20 text-red-100"
                      : "text-red-200/40 hover:text-red-100"
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
              <div className="rounded-xl bg-[#111111] border border-red-500/10 p-6 text-center">
                <p className="text-sm text-red-200/50">
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
      className={`rounded-2xl bg-white/[0.03] backdrop-blur-sm border ${
        warning ? "border-amber-500/20" : "border-red-500/10"
      } p-4 sm:p-5 min-w-0`}
    >
      <p className="text-xs font-medium text-red-200/50 mb-2">{label}</p>
      <p className={`text-2xl font-bold ${warning ? "text-amber-300" : "text-red-100"}`}>
        {value}
      </p>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-[10px] uppercase tracking-widest text-red-300/35 font-semibold mb-1">
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
      className={`rounded-xl bg-[#111111] border ${
        overdue ? "border-amber-500/25" : "border-red-500/10"
      } p-4 min-w-0`}
    >
      <div className="flex items-start gap-3">
        <button
          onClick={onToggle}
          className={`mt-0.5 h-5 w-5 rounded-full border shrink-0 flex items-center justify-center transition-all ${
            task.status === "done"
              ? "bg-emerald-500/20 border-emerald-500/40"
              : "border-red-500/30 hover:border-red-500/60"
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
                className={`text-sm font-semibold break-words ${
                  task.status === "done"
                    ? "text-red-200/35 line-through"
                    : "text-red-100"
                }`}
              >
                {task.title}
              </h4>

              {task.notes && (
                <p className="text-xs text-red-200/40 mt-1 whitespace-pre-wrap break-words">
                  {task.notes}
                </p>
              )}
            </div>

            <button
              onClick={onDelete}
              className="self-start rounded-lg border border-red-500/10 bg-red-500/5 hover:bg-red-500/15 px-2.5 py-1.5 text-[11px] text-red-300/70 transition-all"
            >
              Delete
            </button>
          </div>

          <div className="flex flex-wrap gap-2 mt-3">
            <span className="rounded-full border border-red-500/10 bg-red-500/5 px-2.5 py-1 text-[11px] text-red-200/50">
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
                  : "text-red-200/50 bg-red-500/5 border-red-500/10"
              }`}
            >
              {overdue ? "Overdue · " : ""}
              {formatDate(task.dueDate)}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}

function TaskSkeleton() {
  return (
    <div className="rounded-xl bg-[#111111] border border-red-500/10 p-4 animate-pulse">
      <div className="h-4 w-2/3 bg-red-500/10 rounded mb-3" />
      <div className="h-3 w-1/2 bg-red-500/5 rounded mb-4" />
      <div className="flex gap-2">
        <div className="h-6 w-20 bg-red-500/5 rounded-full" />
        <div className="h-6 w-20 bg-red-500/5 rounded-full" />
      </div>
    </div>
  );
}