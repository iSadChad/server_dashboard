"use client";

import { useCallback, useEffect, useState } from "react";
import PageLayout from "../../components/PageLayout";

function formatDate(value) {
  if (!value) return "Unknown";

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Unknown" : date.toLocaleString();
}

export default function NotesPage() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const loadNotes = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/notes", { cache: "no-store" });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Request failed (${response.status})`);
      }

      if (!Array.isArray(data)) {
        throw new Error("The API returned an unexpected response");
      }

      setNotes(data);
    } catch (requestError) {
      setError(requestError.message || "Could not load notes");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initialLoad = window.setTimeout(loadNotes, 0);
    return () => window.clearTimeout(initialLoad);
  }, [loadNotes]);

  async function createNote(event) {
    event.preventDefault();

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      setSaveError("A title is required");
      return;
    }

    setSaving(true);
    setSaveError("");

    try {
      const response = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: trimmedTitle, content }),
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Request failed (${response.status})`);
      }

      setNotes((currentNotes) => [data, ...currentNotes]);
      setTitle("");
      setContent("");
    } catch (requestError) {
      setSaveError(requestError.message || "Could not create note");
    } finally {
      setSaving(false);
    }
  }

  return (
    <PageLayout>
      <div className="mx-auto w-full max-w-5xl p-4 sm:p-6 lg:p-8">
        <header className="mb-6 flex flex-col gap-4 rounded-2xl border border-fuchsia-300/20 bg-violet-950/30 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-mono text-xs uppercase tracking-[0.2em] text-cyan-300/70">
              GET + POST · /api/notes
            </p>
            <h2 className="mt-2 text-3xl font-black text-white">Notes</h2>
          </div>

          <button
            type="button"
            onClick={loadNotes}
            disabled={loading}
            className="vapor-button rounded-xl border px-4 py-2 text-sm font-semibold text-cyan-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        </header>

        <form
          onSubmit={createNote}
          className="vapor-panel mb-6 rounded-2xl border border-cyan-300/15 bg-violet-950/30 p-5"
        >
          <div className="mb-4">
            <h3 className="text-lg font-bold text-white">Create a note</h3>
            <p className="mt-1 text-sm text-violet-100/55">
              This sends a POST request to the notes API.
            </p>
          </div>

          <div className="grid gap-4">
            <label className="grid gap-2 text-sm font-medium text-violet-100/80">
              Title
              <input
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                maxLength={255}
                required
                disabled={saving}
                placeholder="Note title"
                className="vapor-input w-full border px-3 py-2.5 text-sm"
              />
            </label>

            <label className="grid gap-2 text-sm font-medium text-violet-100/80">
              Content
              <textarea
                value={content}
                onChange={(event) => setContent(event.target.value)}
                disabled={saving}
                rows={5}
                placeholder="Write something…"
                className="vapor-input w-full resize-y border px-3 py-2.5 text-sm"
              />
            </label>
          </div>

          {saveError && (
            <p className="mt-3 text-sm text-fuchsia-200" role="alert">
              {saveError}
            </p>
          )}

          <div className="mt-4 flex justify-end">
            <button
              type="submit"
              disabled={saving || !title.trim()}
              className="vapor-button rounded-xl border px-5 py-2.5 text-sm font-semibold text-cyan-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving…" : "Create note"}
            </button>
          </div>
        </form>

        {error && (
          <div className="mb-4 rounded-xl border border-fuchsia-400/40 bg-fuchsia-500/10 p-4 text-sm text-fuchsia-100">
            <p className="font-bold">API request failed</p>
            <p className="mt-1 font-mono text-xs opacity-80">{error}</p>
          </div>
        )}

        {!error && loading && (
          <div className="rounded-2xl border border-cyan-300/15 bg-violet-950/20 p-8 text-center text-violet-100/60">
            Loading notes…
          </div>
        )}

        {!error && !loading && notes.length === 0 && (
          <div className="rounded-2xl border border-cyan-300/15 bg-violet-950/20 p-8 text-center">
            <p className="font-semibold text-cyan-100">No notes yet</p>
            <p className="mt-2 text-sm text-violet-100/55">
              Use the form above to create your first note.
            </p>
          </div>
        )}

        {!error && !loading && notes.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2">
            {notes.map((note) => (
              <article
                key={note.id}
                className="vapor-card rounded-2xl border border-cyan-300/15 bg-violet-950/30 p-5"
              >
                <h3 className="text-lg font-bold text-white">{note.title}</h3>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-violet-100/70">
                  {note.content || "No content"}
                </p>
                <p className="mt-5 border-t border-violet-200/10 pt-3 font-mono text-xs text-cyan-100/45">
                  Updated {formatDate(note.updated_at)}
                </p>
              </article>
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  );
}
