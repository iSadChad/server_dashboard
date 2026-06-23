"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

function formatBytes(bytes) {
  const number = Number(bytes);

  if (!number || number === 0) return "0 B";

  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(number) / Math.log(k));

  return parseFloat((number / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

const navItems = [
  {
    label: "Dashboard",
    href: "/",
    icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
  },
  {
    label: "Files",
    href: "/files",
    icon: "M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z",
  },
  {
    label: "Databases",
    href: "/databases",
    icon: "M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4",
  },
];

function InfoCard({ title, value, sub, icon }) {
  return (
    <div className="rounded-2xl bg-[#110e28] border border-purple-500/10 p-5 hover:border-purple-500/25 transition-all">
      <div className="flex items-center justify-between gap-4 mb-3">
        <span className="text-xs font-medium text-purple-200/50">
          {title}
        </span>

        <div className="w-9 h-9 rounded-xl bg-violet-500/15 border border-violet-500/20 flex items-center justify-center text-violet-300">
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d={icon} />
          </svg>
        </div>
      </div>

      <p className="text-2xl font-bold">{value}</p>

      {sub && (
        <p className="text-[11px] text-purple-200/30 mt-1 font-mono">
          {sub}
        </p>
      )}
    </div>
  );
}

export default function FilesPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [stats, setStats] = useState({
    disk: { used: 0, total: 0 },
  });
  const [loading, setLoading] = useState(true);

  const nextcloudUrl =
    process.env.NEXT_PUBLIC_NEXTCLOUD_URL || "http://YOUR_SERVER_IP";

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/stats");

        if (!res.ok) {
          throw new Error("Failed to fetch stats");
        }

        const data = await res.json();
        setStats(data);
      } catch (error) {
        console.error("Failed to fetch storage stats:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  const diskUsed = stats.disk?.used || 0;
  const diskTotal = stats.disk?.total || 0;
  const diskFree = Math.max(diskTotal - diskUsed, 0);
  const diskPercent =
    diskTotal > 0 ? ((diskUsed / diskTotal) * 100).toFixed(1) : "0.0";

  return (
    <div className="flex min-h-screen bg-[#0c0a1d] text-white">
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#110e28] border-r border-purple-500/10 flex flex-col shrink-0 transform transition-transform duration-200 md:relative md:translate-x-0 ${
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-6 border-b border-purple-500/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center font-bold text-sm shadow-lg shadow-violet-500/30">
              CG
            </div>

            <div>
              <h1 className="font-bold text-sm">Chad&apos;s Goon Cave</h1>
              <p className="text-[11px] text-purple-300/50">
                Server Dashboard
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-purple-400/40 px-3 mb-2">
            Menu
          </p>

          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                item.href === "/files"
                  ? "bg-violet-500/15 text-white font-medium shadow-sm shadow-violet-500/10"
                  : "text-purple-200/50 hover:text-white hover:bg-purple-500/10"
              }`}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d={item.icon} />
              </svg>

              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="p-4 md:p-8">
          <div className="flex items-center justify-between mb-6 md:mb-8">
            <div className="flex items-center gap-3">
              <button
                className="md:hidden p-2 rounded-lg bg-[#110e28] border border-purple-500/10 text-purple-200/60"
                onClick={() => setMobileMenuOpen(true)}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              <div>
                <h2 className="text-xl md:text-2xl font-bold">
                  Cloud Storage
                </h2>
                <p className="text-purple-200/40 text-sm mt-1">
                  Nextcloud access and storage overview
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-3xl bg-gradient-to-br from-violet-500/15 to-indigo-500/10 border border-purple-500/20 p-5 md:p-7 mb-6 md:mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
              <div>
                <p className="text-xs uppercase tracking-widest text-purple-300/50 font-semibold mb-2">
                  Private cloud
                </p>

                <h3 className="text-2xl md:text-3xl font-bold mb-2">
                  Open your Nextcloud drive
                </h3>

                <p className="text-sm text-purple-100/50 max-w-2xl">
                  Upload, delete, sync, and manage your files through
                  Nextcloud. Your dashboard stays the control panel, while
                  Nextcloud handles the actual file storage work.
                </p>

                <p className="text-xs text-purple-300/35 font-mono mt-3 break-all">
                  {nextcloudUrl}
                </p>
              </div>

              <a
                href={nextcloudUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-violet-500 hover:bg-violet-400 text-white px-5 py-3 text-sm font-semibold transition-all shadow-lg shadow-violet-500/20"
              >
                Open Nextcloud
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M7 17L17 7" />
                  <path d="M7 7h10v10" />
                </svg>
              </a>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 mb-6 md:mb-8">
            <InfoCard
              title="Storage Used"
              value={loading ? "—" : formatBytes(diskUsed)}
              sub={loading ? "" : `${diskPercent}% of server disk`}
              icon="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"
            />

            <InfoCard
              title="Storage Free"
              value={loading ? "—" : formatBytes(diskFree)}
              sub="Available on server disk"
              icon="M12 3v18M3 12h18"
            />

            <InfoCard
              title="Storage Total"
              value={loading ? "—" : formatBytes(diskTotal)}
              sub="Total server disk capacity"
              icon="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
            <div className="rounded-2xl bg-[#110e28] border border-purple-500/10 p-5">
              <h3 className="text-sm font-semibold text-purple-200/70 mb-3">
                What belongs in Nextcloud?
              </h3>

              <div className="space-y-3 text-sm text-purple-100/55">
                <div className="flex gap-3">
                  <span className="text-emerald-400">✓</span>
                  <p>School files, assignments, notes, PDFs, and documents.</p>
                </div>

                <div className="flex gap-3">
                  <span className="text-emerald-400">✓</span>
                  <p>Project files you want available across devices.</p>
                </div>

                <div className="flex gap-3">
                  <span className="text-emerald-400">✓</span>
                  <p>Photos or phone uploads, if you enable mobile upload.</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-[#110e28] border border-purple-500/10 p-5">
              <h3 className="text-sm font-semibold text-purple-200/70 mb-3">
                What should stay out?
              </h3>

              <div className="space-y-3 text-sm text-purple-100/55">
                <div className="flex gap-3">
                  <span className="text-rose-400">×</span>
                  <p>
                    Passwords, API tokens, SSH private keys, and `.env.local`
                    files.
                  </p>
                </div>

                <div className="flex gap-3">
                  <span className="text-rose-400">×</span>
                  <p>
                    `node_modules`, build folders, and random generated junk.
                  </p>
                </div>

                <div className="flex gap-3">
                  <span className="text-rose-400">×</span>
                  <p>
                    Raw PostgreSQL database folders. Back those up properly
                    instead.
                  </p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 rounded-2xl bg-[#110e28] border border-purple-500/10 p-5">
              <h3 className="text-sm font-semibold text-purple-200/70 mb-3">
                Sync setup
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="rounded-xl bg-[#0c0a1d] border border-purple-500/10 p-4">
                  <p className="text-xs font-semibold text-purple-300/60 mb-1">
                    PC / Laptop
                  </p>
                  <p className="text-sm text-purple-100/50">
                    Use the Nextcloud desktop client and sync selected folders.
                  </p>
                </div>

                <div className="rounded-xl bg-[#0c0a1d] border border-purple-500/10 p-4">
                  <p className="text-xs font-semibold text-purple-300/60 mb-1">
                    Phone
                  </p>
                  <p className="text-sm text-purple-100/50">
                    Use the Nextcloud mobile app for access and uploads.
                  </p>
                </div>

                <div className="rounded-xl bg-[#0c0a1d] border border-purple-500/10 p-4">
                  <p className="text-xs font-semibold text-purple-300/60 mb-1">
                    Dashboard
                  </p>
                  <p className="text-sm text-purple-100/50">
                    Use this page as your storage overview and shortcut hub.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}