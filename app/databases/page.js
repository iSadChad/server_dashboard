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

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ▌ FAKE_DATA — remove this entire block when real data is ready
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const USE_FAKE_DATA = true;

const FAKE_DATABASES = [
  { name: "PostgreSQL", type: "PostgreSQL", version: "16.2", status: "running", port: 5432, size: 0 },
  { name: "Redis", type: "Redis", version: "7.2", status: "running", port: 6379, size: 0 },
  { name: "MongoDB", type: "MongoDB", version: "7.0", status: "stopped", port: null, size: 0 },
];
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ▌ END FAKE_DATA
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function StatusDot({ status }) {
  if (status === "running") {
    return <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]" />;
  }
  if (status === "stopped") {
    return <span className="inline-block w-2 h-2 rounded-full bg-rose-400 shadow-[0_0_6px_rgba(251,113,133,0.6)]" />;
  }
  return <span className="inline-block w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.6)]" />;
}

export default function DatabasesPage() {
  const [databases, setDatabases] = useState(USE_FAKE_DATA ? FAKE_DATABASES : []);
  const [loading, setLoading] = useState(USE_FAKE_DATA ? false : true);

  useEffect(() => {
    if (USE_FAKE_DATA) return;
    async function fetchDatabases() {
      try {
        const res = await fetch("/api/databases");
        const data = await res.json();
        setDatabases(data);
      } catch {
        setDatabases([]);
      } finally {
        setLoading(false);
      }
    }
    fetchDatabases();
  }, []);

  return (
    <div className="flex min-h-screen bg-[#0c0a1d] text-white">
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
                item.href === "/databases"
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
              <h2 className="text-2xl font-bold">Databases</h2>
              <p className="text-purple-200/40 text-sm mt-1">Connected database services</p>
            </div>
            {databases.length > 0 && (
              <span className="text-xs text-purple-200/30 font-mono bg-[#110e28] rounded-lg px-3 py-2 border border-purple-500/10">
                {databases.length} db{databases.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="rounded-xl bg-[#110e28] border border-purple-500/10 h-20 animate-pulse" />
              ))}
            </div>
          ) : databases.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[#110e28] border border-purple-500/10 flex items-center justify-center">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-purple-400/30">
                  <ellipse cx="12" cy="5" rx="9" ry="3" />
                  <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
                  <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
                </svg>
              </div>
              <p className="text-purple-200/40 text-sm">No databases detected</p>
              <p className="text-purple-300/20 text-xs mt-1">Install a database service to see it listed here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {databases.map((db, i) => (
                <div
                  key={db.name}
                  className="group rounded-xl bg-[#110e28] border border-purple-500/10 p-5 flex items-center justify-between hover:border-purple-500/25 hover:bg-[#13102a] transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-purple-500/15 border border-purple-500/20 flex items-center justify-center">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <ellipse cx="12" cy="5" rx="9" ry="3" />
                        <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
                        <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-medium text-purple-100">{db.name}</h3>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-xs text-purple-200/40 font-mono">{db.type}</span>
                        {db.version && (
                          <span className="text-xs text-purple-200/25 font-mono">v{db.version}</span>
                        )}
                        {db.size !== undefined && db.size > 0 && (
                          <span className="text-xs text-purple-200/25 font-mono">{formatBytes(db.size)}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {db.port && (
                      <span className="text-xs font-mono text-purple-300/50 bg-purple-500/10 border border-purple-500/15 px-2 py-1 rounded">
                        :{db.port}
                      </span>
                    )}
                    <div className="flex items-center gap-2 text-xs font-mono">
                      <StatusDot status={db.status} />
                      <span className={
                        db.status === "running" ? "text-emerald-400" : db.status === "stopped" ? "text-rose-400" : "text-amber-400"
                      }>
                        {db.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}