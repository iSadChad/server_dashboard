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

function cleanUrl(url) {
  return url.replace(/\/+$/, "");
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

function StatusDot({ online, maintenance }) {
  let color = "bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.7)]";

  if (online && maintenance) {
    color = "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.7)]";
  }

  if (online && !maintenance) {
    color = "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]";
  }

  return <span className={`inline-block w-2.5 h-2.5 rounded-full ${color}`} />;
}

function StorageCard({ title, value, sub }) {
  return (
    <div className="rounded-2xl bg-[#110e28] border border-purple-500/10 p-5">
      <p className="text-xs text-purple-200/40 font-medium mb-2">{title}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
      {sub && <p className="text-[11px] text-purple-300/30 font-mono mt-1">{sub}</p>}
    </div>
  );
}

export default function FilesPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [stats, setStats] = useState({
    disk: { used: 0, total: 0 },
  });
  const [nextcloudStatus, setNextcloudStatus] = useState({
    online: false,
    maintenance: null,
    version: null,
    productName: "Nextcloud",
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [copied, setCopied] = useState(false);

  const nextcloudUrl = cleanUrl(
    process.env.NEXT_PUBLIC_NEXTCLOUD_URL || "http://YOUR_SERVER_IP"
  );

  const nextcloudUser = process.env.NEXT_PUBLIC_NEXTCLOUD_USER || "sadchad";

  const filesUrl = `${nextcloudUrl}/index.php/apps/files/`;
  const webdavUrl = `${nextcloudUrl}/remote.php/dav/files/${nextcloudUser}/`;

  async function loadData() {
    try {
      setRefreshing(true);

      const [statsRes, statusRes] = await Promise.all([
        fetch("/api/stats"),
        fetch("/api/nextcloud/status"),
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      if (statusRes.ok) {
        const statusData = await statusRes.json();
        setNextcloudStatus(statusData);
      }
    } catch (error) {
      console.error("Failed to load cloud panel data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function copyWebdavUrl() {
    try {
      await navigator.clipboard.writeText(webdavUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch (error) {
      console.error("Failed to copy WebDAV URL:", error);
    }
  }

  const diskUsed = stats.disk?.used || 0;
  const diskTotal = stats.disk?.total || 0;
  const diskFree = Math.max(diskTotal - diskUsed, 0);
  const diskPercent =
    diskTotal > 0 ? ((diskUsed / diskTotal) * 100).toFixed(1) : "0.0";

  const statusLabel = nextcloudStatus.online
    ? nextcloudStatus.maintenance
      ? "Maintenance"
      : "Online"
    : "Offline";

  const statusColor = nextcloudStatus.online
    ? nextcloudStatus.maintenance
      ? "text-amber-400"
      : "text-emerald-400"
    : "text-rose-400";

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
          <div className="flex items-center justify-between gap-4 mb-6 md:mb-8">
            <div className="flex items-center gap-3 min-w-0">
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

              <div className="min-w-0">
                <h2 className="text-xl md:text-2xl font-bold">
                  Cloud Control
                </h2>
                <p className="text-purple-200/40 text-sm mt-1">
                  Nextcloud status, storage and quick access
                </p>
              </div>
            </div>

            <button
              onClick={loadData}
              className="rounded-lg bg-[#110e28] hover:bg-[#171239] border border-purple-500/10 text-purple-200/60 px-3 py-2 text-xs font-mono transition-all"
            >
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-4 mb-6">
            <section className="rounded-3xl bg-[#110e28] border border-purple-500/10 p-5 md:p-6">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-5">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <StatusDot
                      online={nextcloudStatus.online}
                      maintenance={nextcloudStatus.maintenance}
                    />
                    <span className={`text-xs font-mono ${statusColor}`}>
                      {statusLabel}
                    </span>
                  </div>

                  <h3 className="text-2xl font-bold">
                    {nextcloudStatus.productName || "Nextcloud"}
                  </h3>

                  <p className="text-sm text-purple-200/40 mt-1">
                    {nextcloudStatus.version
                      ? `Version ${nextcloudStatus.version}`
                      : "Version unavailable"}
                  </p>

                  <p className="text-xs text-purple-300/30 font-mono mt-3 break-all">
                    {nextcloudUrl}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row md:flex-col gap-2 w-full md:w-auto">
                  <a
                    href={filesUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center rounded-xl bg-violet-500 hover:bg-violet-400 text-white px-5 py-3 text-sm font-semibold transition-all shadow-lg shadow-violet-500/20"
                  >
                    Open Files
                  </a>

                  <a
                    href={nextcloudUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 text-purple-200 px-5 py-3 text-sm font-semibold transition-all"
                  >
                    Open Nextcloud
                  </a>
                </div>
              </div>
            </section>

            <section className="rounded-3xl bg-[#110e28] border border-purple-500/10 p-5 md:p-6">
              <p className="text-xs text-purple-200/40 font-medium mb-3">
                Storage usage
              </p>

              <div className="flex items-end justify-between gap-4 mb-3">
                <div>
                  <p className="text-3xl font-bold">
                    {loading ? "—" : `${diskPercent}%`}
                  </p>
                  <p className="text-xs text-purple-300/30 font-mono mt-1">
                    {loading
                      ? "Loading..."
                      : `${formatBytes(diskUsed)} used of ${formatBytes(
                          diskTotal
                        )}`}
                  </p>
                </div>

                <p className="text-xs text-purple-200/35 font-mono">
                  {formatBytes(diskFree)} free
                </p>
              </div>

              <div className="h-3 rounded-full bg-[#0c0a1d] border border-purple-500/10 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all"
                  style={{ width: `${Math.min(Number(diskPercent), 100)}%` }}
                />
              </div>
            </section>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 mb-6">
            <StorageCard
              title="Used"
              value={loading ? "—" : formatBytes(diskUsed)}
              sub="Currently occupied"
            />

            <StorageCard
              title="Free"
              value={loading ? "—" : formatBytes(diskFree)}
              sub="Available space"
            />

            <StorageCard
              title="Total"
              value={loading ? "—" : formatBytes(diskTotal)}
              sub="Server disk capacity"
            />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <section className="rounded-2xl bg-[#110e28] border border-purple-500/10 p-5">
              <div className="flex items-center justify-between gap-4 mb-4">
                <div>
                  <h3 className="text-sm font-semibold text-purple-200/70">
                    WebDAV address
                  </h3>
                  <p className="text-xs text-purple-300/30 mt-1">
                    Useful for clients, network drives and later dashboard
                    integrations.
                  </p>
                </div>

                <button
                  onClick={copyWebdavUrl}
                  className="rounded-lg bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 text-purple-300 px-3 py-2 text-xs font-medium transition-all shrink-0"
                >
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>

              <div className="rounded-xl bg-[#0c0a1d] border border-purple-500/10 p-3">
                <p className="text-xs text-purple-100/60 font-mono break-all">
                  {webdavUrl}
                </p>
              </div>
            </section>

            <section className="rounded-2xl bg-[#110e28] border border-purple-500/10 p-5">
              <h3 className="text-sm font-semibold text-purple-200/70 mb-4">
                Quick actions
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <a
                  href={filesUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl bg-[#0c0a1d] hover:bg-[#171239] border border-purple-500/10 p-4 transition-all"
                >
                  <p className="text-sm font-medium text-purple-100">
                    Manage files
                  </p>
                  <p className="text-xs text-purple-300/30 mt-1">
                    Upload, delete and organize
                  </p>
                </a>

                <a
                  href={`${nextcloudUrl}/index.php/settings/user/sync-clients`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl bg-[#0c0a1d] hover:bg-[#171239] border border-purple-500/10 p-4 transition-all"
                >
                  <p className="text-sm font-medium text-purple-100">
                    Sync clients
                  </p>
                  <p className="text-xs text-purple-300/30 mt-1">
                    Desktop and mobile setup
                  </p>
                </a>

                <a
                  href={`${nextcloudUrl}/index.php/settings/user`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl bg-[#0c0a1d] hover:bg-[#171239] border border-purple-500/10 p-4 transition-all"
                >
                  <p className="text-sm font-medium text-purple-100">
                    Account settings
                  </p>
                  <p className="text-xs text-purple-300/30 mt-1">
                    Profile and preferences
                  </p>
                </a>

                <a
                  href={`${nextcloudUrl}/index.php/apps/files/trashbin`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl bg-[#0c0a1d] hover:bg-[#171239] border border-purple-500/10 p-4 transition-all"
                >
                  <p className="text-sm font-medium text-purple-100">
                    Deleted files
                  </p>
                  <p className="text-xs text-purple-300/30 mt-1">
                    Recover removed files
                  </p>
                </a>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}