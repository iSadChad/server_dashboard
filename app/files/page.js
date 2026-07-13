"use client";

import { useEffect, useState } from "react";
import PageLayout from "../../components/PageLayout";

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

async function fetchCloudPanelData() {
  const [statsRes, statusRes] = await Promise.all([
    fetch("/api/stats"),
    fetch("/api/nextcloud/status"),
  ]);

  const statsData = statsRes.ok ? await statsRes.json() : null;
  const statusData = statusRes.ok ? await statusRes.json() : null;

  return { statsData, statusData };
}

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
    <div className="vapor-card group rounded-3xl border border-fuchsia-300/20 bg-linear-to-br from-violet-500/12 to-cyan-400/6 p-5 shadow-[0_20px_45px_rgba(30,0,70,0.22)] transition-all duration-300 hover:-translate-y-1 hover:border-cyan-200/35">
      <p className="vapor-kicker mb-2 font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-cyan-200/55">{title}</p>
      <p className="text-2xl font-black text-fuchsia-50 transition-colors group-hover:text-cyan-100">{value}</p>
      {sub && <p className="vapor-muted mt-1 font-mono text-[11px] text-violet-100/45">{sub}</p>}
    </div>
  );
}

export default function FilesPage() {
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
  const [refreshing, setRefreshing] = useState(true);
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

      const { statsData, statusData } = await fetchCloudPanelData();

      if (statsData) {
        setStats(statsData);
      }

      if (statusData) {
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
    let cancelled = false;

    fetchCloudPanelData()
      .then(({ statsData, statusData }) => {
        if (cancelled) return;

        if (statsData) {
          setStats(statsData);
        }

        if (statusData) {
          setNextcloudStatus(statusData);
        }
      })
      .catch((error) => {
        console.error("Failed to load cloud panel data:", error);
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
          setRefreshing(false);
        }
      });

    return () => {
      cancelled = true;
    };
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
    <PageLayout>
      <div className="vapor-page files-workbench p-4 md:p-8">
        <div className="vapor-header page-command-header relative mb-6 flex items-center justify-between gap-4 overflow-hidden rounded-3xl border border-fuchsia-300/20 bg-linear-to-br from-fuchsia-500/15 via-violet-500/10 to-cyan-400/10 px-5 py-6 shadow-[0_0_55px_rgba(217,70,239,0.14)] md:mb-8 md:px-7 md:py-8">
          <div className="flex items-center gap-3 min-w-0">
            <div className="min-w-0">
              <p className="vapor-kicker mb-2 font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-cyan-300/75">
                Cloud lattice // node 01
              </p>
              <h2 className="vapor-title text-3xl font-black tracking-tight text-white md:text-5xl">
                Cloud Control
              </h2>
              <p className="vapor-muted mt-2 text-sm text-violet-100/55">
                Nextcloud status, storage and quick access
              </p>
            </div>
          </div>

            <button
              onClick={loadData}
              className="vapor-button rounded-xl border border-cyan-300/25 bg-cyan-300/10 px-4 py-2.5 font-mono text-xs uppercase tracking-wider text-cyan-100 transition-all duration-300 hover:-translate-y-0.5 hover:border-fuchsia-200/50 hover:bg-fuchsia-400/15"
            >
              {refreshing ? "Refreshing..." : "Refresh"}
            </button>
          </div>

          <div className="files-control-grid mb-6 grid grid-cols-1 gap-4 xl:grid-cols-[1.35fr_0.65fr]">
            <section className="vapor-panel rounded-3xl border border-fuchsia-300/20 bg-violet-950/35 p-5 shadow-[0_24px_70px_rgba(30,0,65,0.3)] backdrop-blur-xl md:p-7">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-5">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <StatusDot
                      online={nextcloudStatus.online}
                      maintenance={nextcloudStatus.maintenance}
                    />
                    <span className={`vapor-chip font-mono text-xs uppercase tracking-wider ${statusColor}`}>
                      {statusLabel}
                    </span>
                  </div>

                  <h3 className="text-3xl font-black tracking-tight text-fuchsia-50">
                    {nextcloudStatus.productName || "Nextcloud"}
                  </h3>

                  <p className="vapor-muted mt-1 text-sm text-violet-100/55">
                    {nextcloudStatus.version
                      ? `Version ${nextcloudStatus.version}`
                      : "Version unavailable"}
                  </p>

                  <p className="mt-4 break-all font-mono text-xs text-cyan-200/40">
                    {nextcloudUrl}
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row md:flex-col gap-2 w-full md:w-auto">
                  <a
                    href={filesUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="vapor-button inline-flex items-center justify-center rounded-xl border border-fuchsia-200/35 bg-linear-to-r from-fuchsia-500 to-violet-500 px-5 py-3 text-sm font-bold text-white shadow-[0_0_28px_rgba(217,70,239,0.28)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_0_36px_rgba(34,211,238,0.28)]"
                  >
                    Open Files
                  </a>

                  <a
                    href={nextcloudUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="vapor-button inline-flex items-center justify-center rounded-xl border border-cyan-300/25 bg-cyan-300/10 px-5 py-3 text-sm font-bold text-cyan-100 transition-all duration-300 hover:-translate-y-0.5 hover:border-fuchsia-200/50 hover:bg-fuchsia-400/15"
                  >
                    Open Nextcloud
                  </a>
                </div>
              </div>
            </section>

            <section className="vapor-panel rounded-3xl border border-cyan-300/20 bg-linear-to-br from-cyan-400/10 to-violet-500/15 p-5 shadow-[0_24px_70px_rgba(30,0,65,0.3)] backdrop-blur-xl md:p-7">
              <p className="vapor-kicker mb-3 font-mono text-[10px] font-bold uppercase tracking-[0.24em] text-cyan-200/60">
                Storage usage
              </p>

              <div className="flex items-end justify-between gap-4 mb-3">
                <div>
                  <p className="text-4xl font-black tracking-tight text-cyan-50">
                    {loading ? "—" : `${diskPercent}%`}
                  </p>
                  <p className="vapor-muted mt-1 font-mono text-xs text-violet-100/45">
                    {loading
                      ? "Loading..."
                      : `${formatBytes(diskUsed)} used of ${formatBytes(
                          diskTotal
                        )}`}
                  </p>
                </div>

                <p className="vapor-chip rounded-full border border-fuchsia-300/20 bg-fuchsia-300/10 px-3 py-1.5 font-mono text-xs text-fuchsia-100/70">
                  {formatBytes(diskFree)} free
                </p>
              </div>

              <div className="vapor-meter h-3 overflow-hidden rounded-full border border-violet-200/15 bg-violet-950/70 shadow-inner">
                <div
                  className="h-full rounded-full bg-linear-to-r from-fuchsia-500 via-pink-400 to-cyan-300 shadow-[0_0_18px_rgba(34,211,238,0.5)] transition-all"
                  style={{ width: `${Math.min(Number(diskPercent), 100)}%` }}
                />
              </div>
            </section>
          </div>

          <div className="files-storage-strip mb-6 grid grid-cols-1 gap-3 md:grid-cols-3 md:gap-4">
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

          <div className="files-action-grid grid grid-cols-1 gap-4 xl:grid-cols-[0.8fr_1.2fr]">
            <section className="vapor-panel rounded-3xl border border-fuchsia-300/20 bg-violet-950/30 p-5 backdrop-blur-xl md:p-6">
              <div className="flex items-center justify-between gap-4 mb-4">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-fuchsia-100">
                    WebDAV address
                  </h3>
                  <p className="vapor-muted mt-1 text-xs text-violet-100/45">
                    Useful for clients, network drives and later dashboard
                    integrations.
                  </p>
                </div>

                <button
                  onClick={copyWebdavUrl}
                  className="vapor-button shrink-0 rounded-xl border border-cyan-300/25 bg-cyan-300/10 px-3 py-2 text-xs font-bold text-cyan-100 transition-all hover:border-fuchsia-200/50 hover:bg-fuchsia-400/15"
                >
                  {copied ? "Copied" : "Copy"}
                </button>
              </div>

              <div className="rounded-2xl border border-cyan-300/15 bg-violet-950/60 p-4 shadow-inner">
                <p className="break-all font-mono text-xs text-cyan-100/60">
                  {webdavUrl}
                </p>
              </div>
            </section>

            <section className="vapor-panel rounded-3xl border border-cyan-300/20 bg-violet-950/30 p-5 backdrop-blur-xl md:p-6">
              <h3 className="mb-4 text-sm font-bold uppercase tracking-wider text-cyan-100">
                Quick actions
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <a
                  href={filesUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="vapor-list-row group rounded-2xl border border-fuchsia-300/15 bg-fuchsia-400/6 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-cyan-200/35 hover:bg-cyan-300/10"
                >
                  <p className="text-sm font-bold text-fuchsia-50 group-hover:text-cyan-100">
                    Manage files
                  </p>
                  <p className="vapor-muted mt-1 text-xs text-violet-100/40">
                    Upload, delete and organize
                  </p>
                </a>

                <a
                  href={`${nextcloudUrl}/index.php/settings/user/sync-clients`}
                  target="_blank"
                  rel="noreferrer"
                  className="vapor-list-row group rounded-2xl border border-fuchsia-300/15 bg-fuchsia-400/6 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-cyan-200/35 hover:bg-cyan-300/10"
                >
                  <p className="text-sm font-bold text-fuchsia-50 group-hover:text-cyan-100">
                    Sync clients
                  </p>
                  <p className="vapor-muted mt-1 text-xs text-violet-100/40">
                    Desktop and mobile setup
                  </p>
                </a>

                <a
                  href={`${nextcloudUrl}/index.php/settings/user`}
                  target="_blank"
                  rel="noreferrer"
                  className="vapor-list-row group rounded-2xl border border-fuchsia-300/15 bg-fuchsia-400/6 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-cyan-200/35 hover:bg-cyan-300/10"
                >
                  <p className="text-sm font-bold text-fuchsia-50 group-hover:text-cyan-100">
                    Account settings
                  </p>
                  <p className="vapor-muted mt-1 text-xs text-violet-100/40">
                    Profile and preferences
                  </p>
                </a>

                <a
                  href={`${nextcloudUrl}/index.php/apps/files/trashbin`}
                  target="_blank"
                  rel="noreferrer"
                  className="vapor-list-row group rounded-2xl border border-fuchsia-300/15 bg-fuchsia-400/6 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-cyan-200/35 hover:bg-cyan-300/10"
                >
                  <p className="text-sm font-bold text-fuchsia-50 group-hover:text-cyan-100">
                    Deleted files
                  </p>
                  <p className="vapor-muted mt-1 text-xs text-violet-100/40">
                    Recover removed files
                  </p>
                </a>
              </div>
            </section>
          </div>
        </div>
    </PageLayout>
  );
}
