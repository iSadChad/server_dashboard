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

const navItems = [
  { label: "Dashboard", href: "/", icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" },
  { label: "Files", href: "/files", icon: "M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" },
  { label: "Databases", href: "/databases", icon: "M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" },
];



function FileIcon({ type }) {
  const config = {
    PDF: { bg: "bg-rose-500/15", text: "text-rose-400", border: "border-rose-500/20" },
    SQL: { bg: "bg-amber-500/15", text: "text-amber-400", border: "border-amber-500/20" },
    Word: { bg: "bg-blue-500/15", text: "text-blue-400", border: "border-blue-500/20" },
    Image: { bg: "bg-emerald-500/15", text: "text-emerald-400", border: "border-emerald-500/20" },
    Video: { bg: "bg-pink-500/15", text: "text-pink-400", border: "border-pink-500/20" },
    Folder: { bg: "bg-amber-500/15", text: "text-amber-400", border: "border-amber-500/20" },
  };
  const c = config[type] || { bg: "bg-purple-500/15", text: "text-purple-400", border: "border-purple-500/20" };
  return (
    <div className={`w-10 h-10 rounded-lg ${c.bg} ${c.text} ${c.border} border flex items-center justify-center text-[10px] font-bold font-mono`}>
      {type === "Folder" ? (
        <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor">
          <path d="M2 4.5A1.5 1.5 0 013.5 3h3.172a1.5 1.5 0 011.06.44l.829.828A1.5 1.5 0 009.67 4.7H12.5A1.5 1.5 0 0114 6.2v4.3a1.5 1.5 0 01-1.5 1.5h-9A1.5 1.5 0 012 10.5V4.5z" />
        </svg>
      ) : type}
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
      } catch (e) {
        console.error("Failed to fetch files:", e);
        setFiles([]);
      } finally {
        setLoading(false);
      }
    }
    fetchFiles();
  }, []);

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-[#0c0a1d] text-white">
      <aside className="w-64 bg-[#110e28] border-r border-purple-500/10 flex flex-col shrink-0">
        <div className="p-6 border-b border-purple-500/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center font-bold text-sm shadow-lg shadow-violet-500/30">
              CG
            </div>
            <div>
              <h1 className="font-bold text-sm">Chad&apos;s Goon Cave</h1>
              <p className="text-[11px] text-purple-300/50">Server Dashboard</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-purple-400/40 px-3 mb-2">Menu</p>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                item.href === "/files"
                  ? "bg-violet-500/15 text-white font-medium shadow-sm shadow-violet-500/10"
                  : "text-purple-200/50 hover:text-white hover:bg-purple-500/10"
              }`}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d={item.icon} />
              </svg>
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="p-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold">Files</h2>
              <p className="text-purple-200/40 text-sm mt-1">Browse and manage server files</p>
            </div>
            {files.length > 0 && (
              <span className="text-xs text-purple-200/30 font-mono bg-[#110e28] rounded-lg px-3 py-2 border border-purple-500/10">
                {files.length} item{files.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="rounded-xl bg-[#110e28] border border-purple-500/10 h-16 animate-pulse" />
              ))}
            </div>
          ) : files.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#110e28] border border-purple-500/10 flex items-center justify-center">
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none" className="text-purple-400/30">
                  <path d="M4 8.5A2.5 2.5 0 016.5 6h5.172a2.5 2.5 0 011.768.732l1.172 1.172A2.5 2.5 0 0016.378 8.6H21.5A2.5 2.5 0 0124 11.1v8.4a2.5 2.5 0 01-2.5 2.5h-15A2.5 2.5 0 014 19.5V8.5z" stroke="currentColor" strokeWidth="1.5" />
                </svg>
              </div>
              <p className="text-purple-200/40 text-sm">No files found</p>
              <p className="text-purple-300/20 text-xs mt-1 font-mono">
                Add files to the <code className="text-purple-400/40">files/</code> directory
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {files.map((file, i) => (
                <div
                  key={file.path}
                  className="group rounded-xl bg-[#110e28] border border-purple-500/10 p-4 flex items-center gap-4 hover:border-purple-500/25 hover:bg-[#13102a] transition-all"
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  <FileIcon type={file.type || "File"} />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium truncate text-purple-100">{file.name}</h3>
                    <p className="text-xs text-purple-200/30 font-mono mt-0.5">
                      {file.type}{file.size ? ` · ${formatBytes(file.size)}` : ""}
                    </p>
                  </div>
                  <button className="rounded-lg bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/20 text-violet-300 px-4 py-2 text-xs font-medium transition-all shrink-0">
                    Open
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}