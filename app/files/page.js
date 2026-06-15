"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

function formatBytes(bytes) {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function FileIcon({ type }) {
  const config = {
    PDF: { bg: "bg-red-500/15", text: "text-red-400", border: "border-red-500/20" },
    SQL: { bg: "bg-yellow-500/15", text: "text-yellow-400", border: "border-yellow-500/20" },
    Word: { bg: "bg-blue-500/15", text: "text-blue-400", border: "border-blue-500/20" },
    Image: { bg: "bg-green-500/15", text: "text-green-400", border: "border-green-500/20" },
    Video: { bg: "bg-pink-500/15", text: "text-pink-400", border: "border-pink-500/20" },
    Folder: { bg: "bg-amber-500/15", text: "text-amber-400", border: "border-amber-500/20" },
  };
  const c = config[type] || { bg: "bg-neutral-500/15", text: "text-neutral-400", border: "border-neutral-500/20" };
  return (
    <div
      className={`w-11 h-11 rounded-xl ${c.bg} ${c.text} ${c.border} border flex items-center justify-center text-xs font-bold`}
    >
      {type === "Folder" ? (
        <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
          <path d="M2 4.5A1.5 1.5 0 013.5 3h3.172a1.5 1.5 0 011.06.44l.829.828A1.5 1.5 0 009.67 4.7H12.5A1.5 1.5 0 0114 6.2v4.3a1.5 1.5 0 01-1.5 1.5h-9A1.5 1.5 0 012 10.5V4.5z" />
        </svg>
      ) : (
        type
      )}
    </div>
  );
}

export default function FilesPage() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFiles() {
      try {
        const res = await fetch("/api/files");
        const data = await res.json();
        setFiles(data);
      } catch {
        setFiles([]);
      } finally {
        setLoading(false);
      }
    }
    fetchFiles();
  }, []);

  return (
    <main className="min-h-screen bg-[#050507] text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-transparent to-transparent pointer-events-none" />

      <header className="relative border-b border-white/5 px-8 py-5 flex items-center justify-between backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-sm shadow-lg shadow-indigo-500/25">
            TC
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Chad's Goon Cave</h1>
            <p className="text-neutral-500 text-xs">My Files</p>
          </div>
        </div>
        <Link
          href="/"
          className="rounded-xl glass glass-hover px-5 py-2.5 font-medium transition-all hover:-translate-y-0.5"
        >
          <span className="flex items-center gap-2 text-neutral-300">
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
            >
              <path
                d="M10 12l-4-4 4-4"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Dashboard
          </span>
        </Link>
      </header>

      <section className="relative max-w-5xl mx-auto p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-neutral-500">
            All Files
          </h2>
          {files.length > 0 && (
            <span className="text-xs text-neutral-500 font-mono">
              {files.length} item{files.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="rounded-2xl glass h-16 animate-shimmer"
                style={{ animationDelay: `${i * 100}ms` }}
              />
            ))}
          </div>
        ) : files.length === 0 ? (
          <div className="text-center py-20 animate-fade-in">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-neutral-800/50 flex items-center justify-center">
              <svg
                width="28"
                height="28"
                viewBox="0 0 28 28"
                fill="none"
                className="text-neutral-600"
              >
                <path
                  d="M4 8.5A2.5 2.5 0 016.5 6h5.172a2.5 2.5 0 011.768.732l1.172 1.172A2.5 2.5 0 0016.378 8.6H21.5A2.5 2.5 0 0124 11.1v8.4a2.5 2.5 0 01-2.5 2.5h-15A2.5 2.5 0 014 19.5V8.5z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
              </svg>
            </div>
            <p className="text-neutral-500 text-sm">No files found</p>
            <p className="text-neutral-600 text-xs mt-1">
              Add files to the <code className="font-mono bg-neutral-800 px-1.5 py-0.5 rounded">files/</code> directory
            </p>
          </div>
        ) : (
          <div className="grid gap-2">
            {files.map((file, i) => (
              <div
                key={file.path}
                className="group rounded-xl glass glass-hover p-4 flex items-center gap-4 transition-all animate-fade-in hover:-translate-y-0.5 cursor-pointer"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <FileIcon type={file.type || "File"} />
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate text-neutral-200 group-hover:text-white transition-colors">
                    {file.name}
                  </h3>
                  <p className="text-sm text-neutral-500 mt-0.5">
                    {file.type}
                    {file.size ? (
                      <span className="text-neutral-600"> · {formatBytes(file.size)}</span>
                    ) : (
                      ""
                    )}
                  </p>
                </div>
                <button className="rounded-lg bg-white/10 hover:bg-white text-black hover:text-black px-4 py-2 text-sm font-medium transition-all hover:shadow-lg hover:shadow-white/10 shrink-0">
                  Open
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}