"use client";

import { useCallback, useEffect, useState } from "react";
import PageLayout from "../../components/PageLayout";
import WhiteboardEditor from "../../components/WhiteboardEditor";


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
  const [deletingId, setDeletingId] = useState(null);
  const [deleteError, setDeleteError] = useState("");
  const [whiteboardOpen, setWhiteboardOpen] = useState(true);

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

  async function deleteNote(note) {
    const confirmed = window.confirm(`Delete “${note.title}”?`);
    if (!confirmed) return;

    setDeletingId(note.id);
    setDeleteError("");

    try {
      const response = await fetch(`/api/notes/${note.id}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || data.error || "Could not delete note");
      }

      setNotes((currentNotes) =>
        currentNotes.filter((currentNote) => currentNote.id !== note.id)
      );
      
      if (selectedNote?.id === note.id) {
      setSelectedNote(null);
      
    }
    } catch (requestError) {
      setDeleteError(requestError.message || "Could not delete note");
    } finally {
      setDeletingId(null);
    }
  }

    
  
  return (
    <PageLayout>
      <div className="mx-auto w-full max-w-7xl px-3 py-4 sm:px-6 sm:py-7 lg:px-8">
        <header className="mb-5 flex flex-col gap-4 sm:mb-7 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 font-mono text-[10px] font-bold uppercase tracking-[0.28em] text-cyan-300/65">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(103,232,249,0.8)]" />
              Ideas workspace
            </div>
            <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
              Notes <span className="text-fuchsia-300">&amp;</span> canvas
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-violet-100/55">
              Sketch the big picture, then save the details below.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-full border border-violet-200/10 bg-violet-950/40 px-3 py-2 font-mono text-xs text-violet-100/45">
              {notes.length} {notes.length === 1 ? "note" : "notes"}
            </span>
            <button
              type="button"
              onClick={loadNotes}
              disabled={loading}
              className="vapor-button inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold text-cyan-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <svg className={loading ? "animate-spin" : ""} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                <path d="M20 11a8.1 8.1 0 0 0-15.5-2M4 4v5h5M4 13a8.1 8.1 0 0 0 15.5 2M20 20v-5h-5" />
              </svg>
              {loading ? "Syncing" : "Refresh"}
            </button>
          </div>
        </header>

        <section className="mb-6 overflow-hidden rounded-3xl border border-cyan-300/20 bg-violet-950/35 shadow-[0_24px_70px_rgba(20,0,60,0.38)] sm:mb-8">
          <div className="flex items-center justify-between border-b border-violet-200/10 px-4 py-3 sm:px-5">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-fuchsia-300/20 bg-fuchsia-400/10 text-fuchsia-200">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M3 3h18v18H3zM8 16l3-3 2 2 3-4 2 3" /></svg>
              </span>
              <div>
                <h3 className="text-sm font-bold text-white">Whiteboard</h3>
                <p className="hidden text-[11px] text-violet-100/40 sm:block">Draw, connect, and map out your thoughts</p>
              </div>
            </div>
            <button type="button" onClick={() => setWhiteboardOpen((current) => !current)} className="rounded-lg px-3 py-2 text-xs font-semibold text-cyan-200/70 hover:bg-cyan-400/10">
              {whiteboardOpen ? "Collapse" : "Open"}
            </button>
          </div>
          {whiteboardOpen && <WhiteboardEditor />}
        </section>

        <div className="grid items-start gap-5 lg:grid-cols-[minmax(260px,0.38fr)_minmax(0,1fr)] lg:gap-6">
          <form onSubmit={createNote} className="vapor-panel rounded-3xl border border-fuchsia-300/15 bg-violet-950/35 p-4 sm:p-5 lg:sticky lg:top-6">
            <div className="mb-5">
              <p className="font-mono text-[9px] font-bold uppercase tracking-[0.25em] text-fuchsia-300/60">Quick capture</p>
              <h3 className="mt-1 text-xl font-black text-white">New note</h3>
            </div>
            <div className="grid gap-4">
              <label className="grid gap-2 text-xs font-semibold text-violet-100/65">
                Title
                <input type="text" value={title} onChange={(event) => setTitle(event.target.value)} maxLength={255} required disabled={saving} placeholder="What is this about?" className="vapor-input w-full border px-3.5 py-3 text-sm" />
              </label>
              <label className="grid gap-2 text-xs font-semibold text-violet-100/65">
                Details
                <textarea value={content} onChange={(event) => setContent(event.target.value)} disabled={saving} rows={6} placeholder="Capture the thought before it disappears…" className="vapor-input w-full resize-y border px-3.5 py-3 text-sm leading-6" />
              </label>
            </div>
            {saveError && <p className="mt-3 text-sm text-fuchsia-200" role="alert">{saveError}</p>}
            <button type="submit" disabled={saving || !title.trim()} className="vapor-button mt-4 flex w-full items-center justify-center gap-2 rounded-xl border px-5 py-3 text-sm font-bold text-cyan-100 disabled:cursor-not-allowed disabled:opacity-50">
              <span className="text-lg leading-none">+</span> {saving ? "Saving…" : "Save note"}
            </button>
          </form>

          <section aria-labelledby="saved-notes-heading">
            <div className="mb-3 flex items-center justify-between px-1">
              <div>
                <p className="font-mono text-[9px] font-bold uppercase tracking-[0.25em] text-cyan-300/55">Archive</p>
                <h3 id="saved-notes-heading" className="mt-1 text-xl font-black text-white">Saved notes</h3>
              </div>
            </div>

            {(error || deleteError) && (
              <div className="mb-4 rounded-2xl border border-fuchsia-400/35 bg-fuchsia-500/10 p-4 text-sm text-fuchsia-100" role="alert">
                <p className="font-bold">Something went wrong</p>
                <p className="mt-1 text-xs opacity-75">{error || deleteError}</p>
              </div>
            )}
            {!error && loading && <div className="rounded-2xl border border-cyan-300/10 bg-violet-950/20 p-10 text-center text-sm text-violet-100/50">Loading your notes…</div>}
            {!error && !loading && notes.length === 0 && (
              <div className="rounded-3xl border border-dashed border-cyan-300/20 bg-violet-950/20 p-10 text-center">
                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-300/10 text-xl text-cyan-200">+</div>
                <p className="mt-4 font-bold text-cyan-100">Your archive is empty</p>
                <p className="mt-1 text-sm text-violet-100/45">Create a note and it will appear here.</p>
              </div>
            )}
            {!error && !loading && notes.length > 0 && (
              <div className="grid gap-3 sm:grid-cols-2">
                {notes.map((note) => (
                  <article key={note.id} className="vapor-card group flex min-h-44 flex-col rounded-2xl border border-cyan-300/12 bg-linear-to-br from-violet-950/55 to-fuchsia-950/25 p-5 transition hover:-translate-y-0.5 hover:border-cyan-300/25">
                    <h4 className="text-base font-bold leading-snug text-white">{note.title}</h4>
                    <p className="mt-2 line-clamp-4 whitespace-pre-wrap text-sm leading-6 text-violet-100/60">{note.content || "No additional details"}</p>
                    <div className="mt-auto flex items-center justify-between gap-3 border-t border-violet-200/8 pt-3">
                      <p className="truncate font-mono text-[9px] uppercase tracking-wide text-cyan-100/35">{formatDate(note.updated_at)}</p>
                      <button type="button" onClick={() => setSelectedNote(note)} className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-cyan-200/70 transition hover:bg-cyan-500/10 hover:text-cyan-100"> Open board
                      </button>
                      <button type="button" onClick={() => deleteNote(note)} disabled={deletingId === note.id} aria-label={`Delete ${note.title}`} className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-fuchsia-200/60 transition hover:bg-fuchsia-500/10 hover:text-fuchsia-100 disabled:opacity-40">
                        {deletingId === note.id ? "…" : "Delete"}
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </PageLayout>
  );
}
