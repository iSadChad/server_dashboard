"use client";

import { useState, useEffect } from "react";
import PageLayout from "../components/PageLayout";
import { formatBytes } from "../utils/formatBytes";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";

const defaultStats = {
  cpu: 0,
  memory: { used: 0, total: 0 },
  disk: { used: 0, total: 0 },
  uptime: 0,
};

const defaultBackupStatus = {
  status: "warning",
  message: "No backup status loaded",
  repository: null,
  snapshotCount: 0,
  latestSnapshot: null,
  updatedAt: null,
};

const defaultPm2Status = {
  status: "warning",
  message: "No PM2 status loaded",
  expected: [],
  processes: [],
  updatedAt: null,
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1a1a1a]/90 backdrop-blur border border-red-500/20 rounded-lg px-3 py-2 text-xs shadow-lg">
        <p className="text-white/70 mb-1">{label}</p>

        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }} className="font-medium">
            {p.name}: {p.value}
          </p>
        ))}
      </div>
    );
  }

  return null;
};

function formatDateTime(value) {
  if (!value) return "—";

  try {
    return new Date(value).toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

function DashboardContent() {
  const [mounted, setMounted] = useState(false);
  const [stats, setStats] = useState(defaultStats);
  const [loading, setLoading] = useState(true);
  const [weekData, setWeekData] = useState([]);
  const [monthData, setMonthData] = useState([]);
  const [backupStatus, setBackupStatus] = useState(defaultBackupStatus);
  const [backupLoading, setBackupLoading] = useState(true);
  const [pm2Status, setPm2Status] = useState(defaultPm2Status);
  const [pm2Loading, setPm2Loading] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/stats");
        const data = await res.json();
        setStats(data);
      } catch {
        setStats(defaultStats);
      } finally {
        setLoading(false);
      }
    }

    async function fetchCharts() {
      try {
        const res = await fetch("/api/chart");
        const data = await res.json();

        if (data.week) setWeekData(data.week);
        if (data.month) setMonthData(data.month);
      } catch (error) {
        console.error("Failed to fetch charts:", error);
      }
    }

    async function fetchBackups() {
      try {
        const res = await fetch("/api/backups");
        const data = await res.json();

        setBackupStatus(data);
      } catch (error) {
        console.error("Failed to fetch backup status:", error);

        setBackupStatus({
          ...defaultBackupStatus,
          status: "error",
          message: "Could not load backup status",
        });
      } finally {
        setBackupLoading(false);
      }
    }
async function fetchPm2Status() {
  try {
    const res = await fetch("/api/pm2");
    const data = await res.json();

    setPm2Status(data);
  } catch (error) {
    console.error("Failed to fetch PM2 status:", error);

    setPm2Status({
      ...defaultPm2Status,
      status: "error",
      message: "Could not load PM2 status",
    });
  } finally {
    setPm2Loading(false);
  }
}
    fetchStats();
fetchCharts();
fetchBackups();
fetchPm2Status();

const statsInterval = setInterval(fetchStats, 5000);
const chartsInterval = setInterval(fetchCharts, 60000);
const backupsInterval = setInterval(fetchBackups, 60000);
const pm2Interval = setInterval(fetchPm2Status, 30000);

return () => {
  clearInterval(statsInterval);
  clearInterval(chartsInterval);
  clearInterval(backupsInterval);
  clearInterval(pm2Interval);
};
  }, []);

  const memPercent =
    stats.memory.total > 0
      ? ((stats.memory.used / stats.memory.total) * 100).toFixed(1)
      : 0;

  const diskPercent =
    stats.disk.total > 0
      ? ((stats.disk.used / stats.disk.total) * 100).toFixed(1)
      : 0;

  const uptimeHours = Math.floor(stats.uptime / 3600);
  const uptimeMinutes = Math.floor((stats.uptime % 3600) / 60);
  const memPercentNum = parseFloat(memPercent) || 0;
  const diskPercentNum = parseFloat(diskPercent) || 0;

  const memPieData = [
    { name: "Used", value: memPercentNum || 1, color: "#ef4444" },
    { name: "Free", value: 100 - (memPercentNum || 1), color: "#1a0a0a" },
  ];

  const diskPieData = [
    { name: "Used", value: diskPercentNum || 1, color: "#f43f5e" },
    { name: "Free", value: 100 - (diskPercentNum || 1), color: "#1a0a0a" },
  ];

  return (
    <div className="p-3 sm:p-4 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 md:mb-8">
        <div>
          <h2 className="text-xl md:text-2xl font-bold">Dashboard</h2>
          <p className="text-red-200/40 text-sm mt-1">
            System overview and analytics
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2 text-xs text-red-200/40 font-mono bg-[#111111] rounded-lg px-3 py-2 border border-red-500/10 w-full sm:w-auto">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="truncate">
              Live · {loading ? "..." : `${stats.cpu.toFixed(0)}% CPU`}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
        <StatCard
          label="CPU Usage"
          value={loading ? "—" : `${stats.cpu.toFixed(1)}%`}
          sub={loading ? "" : "Current load"}
          color="from-red-500 to-red-700"
          icon="M9 3v2m6-2v2M9 19v2m6-2v2M5.8 5.8l1.4 1.4M16.2 16.8l1.4 1.4M3 9h2m14 0h2M3 15h2m14 0h2M5.8 18.2l1.4-1.4M16.2 7.2l1.4-1.4M9 9h6v6H9z"
        />

        <StatCard
          label="Memory"
          value={loading ? "—" : `${memPercent}%`}
          sub={
            loading
              ? ""
              : `${formatBytes(stats.memory.used)} / ${formatBytes(
                  stats.memory.total
                )}`
          }
          color="from-rose-500 to-red-600"
          icon="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
        />

        <StatCard
          label="Disk"
          value={loading ? "—" : `${diskPercent}%`}
          sub={
            loading
              ? ""
              : `${formatBytes(stats.disk.used)} / ${formatBytes(
                  stats.disk.total
                )}`
          }
          color="from-red-600 to-rose-600"
          icon="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"
        />

        <StatCard
          label="Uptime"
          value={loading ? "—" : `${uptimeHours}h ${uptimeMinutes}m`}
          sub="Since last boot"
          color="from-rose-500 to-red-700"
          icon="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </div>

      <BackupStatusPanel backup={backupStatus} loading={backupLoading} />
      <Pm2StatusPanel pm2={pm2Status} loading={pm2Loading} />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-3 md:gap-4 mb-6 md:mb-8">
        <div className="xl:col-span-2 rounded-2xl bg-white/[0.03] backdrop-blur-sm border border-red-500/10 p-4 md:p-6 min-w-0">
          <h3 className="text-sm font-semibold text-red-200/70 mb-1">
            Network Activity
          </h3>
          <p className="text-[11px] text-red-300/30 mb-4">
            Inbound vs Outbound over 12 months
          </p>

          {mounted ? (
            <div className="h-[220px] sm:h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={monthData}
                  margin={{ top: 5, right: 10, left: -10, bottom: 5 }}
                >
                  <defs>
                    <linearGradient
                      id="gradInbound"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="#ef4444"
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="95%"
                        stopColor="#ef4444"
                        stopOpacity={0}
                      />
                    </linearGradient>

                    <linearGradient
                      id="gradOutbound"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="#f43f5e"
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="95%"
                        stopColor="#f43f5e"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>

                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#a35050", fontSize: 11 }}
                  />

                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#a35050", fontSize: 11 }}
                    width={32}
                  />

                  <Tooltip content={<CustomTooltip />} />

                  <Area
                    type="monotone"
                    dataKey="inbound"
                    stroke="#ef4444"
                    fill="url(#gradInbound)"
                    strokeWidth={2}
                    name="Inbound"
                  />

                  <Area
                    type="monotone"
                    dataKey="outbound"
                    stroke="#f43f5e"
                    fill="url(#gradOutbound)"
                    strokeWidth={2}
                    name="Outbound"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="w-full h-[220px] sm:h-[260px] animate-pulse rounded-lg bg-red-500/5" />
          )}
        </div>

        <div className="rounded-2xl bg-white/[0.03] backdrop-blur-sm border border-red-500/10 p-4 md:p-6 min-w-0">
          <h3 className="text-sm font-semibold text-red-200/70 mb-1">
            Memory Split
          </h3>
          <p className="text-[11px] text-red-300/30 mb-4">Used vs Free</p>

          {mounted ? (
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={memPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                  >
                    {memPieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="w-full h-[180px] animate-pulse rounded-lg bg-red-500/5" />
          )}

          <div className="flex flex-wrap justify-center gap-4 mt-2">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
              <span className="text-[11px] text-red-200/50">
                Used {memPercent}%
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-[#1a0a0a]" />
              <span className="text-[11px] text-red-200/50">Free</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4">
        <div className="rounded-2xl bg-white/[0.03] backdrop-blur-sm border border-red-500/10 p-4 md:p-6 min-w-0">
          <h3 className="text-sm font-semibold text-red-200/70 mb-1">
            Weekly CPU
          </h3>
          <p className="text-[11px] text-red-300/30 mb-4">
            Avg usage by day
          </p>

          {mounted ? (
            <div className="h-[150px] sm:h-[160px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weekData} barCategoryMaxWidth={16}>
                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#a35050", fontSize: 10 }}
                  />

                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#a35050", fontSize: 10 }}
                    width={30}
                  />

                  <Tooltip content={<CustomTooltip />} />

                  <Bar
                    dataKey="cpu"
                    fill="#ef4444"
                    radius={[4, 4, 0, 0]}
                    name="CPU"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="w-full h-[150px] sm:h-[160px] animate-pulse rounded-lg bg-red-500/5" />
          )}
        </div>

        <div className="rounded-2xl bg-white/[0.03] backdrop-blur-sm border border-red-500/10 p-4 md:p-6 min-w-0">
          <h3 className="text-sm font-semibold text-red-200/70 mb-1">
            Weekly Memory
          </h3>
          <p className="text-[11px] text-red-300/30 mb-4">
            Avg usage by day
          </p>

          {mounted ? (
            <div className="h-[150px] sm:h-[160px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weekData} barCategoryMaxWidth={16}>
                  <XAxis
                    dataKey="day"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#a35050", fontSize: 10 }}
                  />

                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#a35050", fontSize: 10 }}
                    width={30}
                  />

                  <Tooltip content={<CustomTooltip />} />

                  <Bar
                    dataKey="mem"
                    fill="#f43f5e"
                    radius={[4, 4, 0, 0]}
                    name="Memory"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="w-full h-[150px] sm:h-[160px] animate-pulse rounded-lg bg-red-500/5" />
          )}
        </div>

        <div className="rounded-2xl bg-white/[0.03] backdrop-blur-sm border border-red-500/10 p-4 md:p-6 min-w-0">
          <h3 className="text-sm font-semibold text-red-200/70 mb-1">
            Disk Usage
          </h3>
          <p className="text-[11px] text-red-300/30 mb-4">Used vs Free</p>

          {mounted ? (
            <div className="h-[180px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={diskPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={4}
                    dataKey="value"
                    stroke="none"
                  >
                    {diskPieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="w-full h-[180px] animate-pulse rounded-lg bg-red-500/5" />
          )}

          <div className="flex flex-wrap justify-center gap-4 mt-2">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span className="text-[11px] text-red-200/50">
                Used {diskPercent}%
              </span>
            </div>

            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-[#1a0a0a]" />
              <span className="text-[11px] text-red-200/50">Free</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <PageLayout>
      <DashboardContent />
    </PageLayout>
  );
}

function BackupStatusPanel({ backup, loading }) {
  const status = backup?.status || "warning";
  const latestSnapshot = backup?.latestSnapshot || null;
  const logLines = backup?.lastLogLines || [];

  const statusStyles = {
    ok: {
      label: "OK",
      dot: "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]",
      text: "text-emerald-400",
      border: "border-emerald-500/20",
      bg: "bg-emerald-500/10",
    },
    warning: {
      label: "Warning",
      dot: "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.7)]",
      text: "text-amber-400",
      border: "border-amber-500/20",
      bg: "bg-amber-500/10",
    },
    error: {
      label: "Error",
      dot: "bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.7)]",
      text: "text-rose-400",
      border: "border-rose-500/20",
      bg: "bg-rose-500/10",
    },
  };

  const style = statusStyles[status] || statusStyles.warning;

  return (
    <div
      className={`rounded-2xl bg-white/[0.03] backdrop-blur-sm border ${style.border} p-4 md:p-6 mb-6 md:mb-8`}
    >
      <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-5">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <span
              className={`inline-block w-2.5 h-2.5 rounded-full shrink-0 ${style.dot}`}
            />
            <span className={`text-xs font-mono ${style.text}`}>
              {loading ? "Loading..." : style.label}
            </span>

            {!loading && backup?.backupAgeLabel && (
              <span className="text-xs text-red-200/30 font-mono">
                · {backup.backupAgeLabel}
              </span>
            )}
          </div>

          <h3 className="text-lg md:text-xl font-bold text-red-100">
            Backup Status
          </h3>

          <p className="text-sm text-red-200/40 mt-1">
            {loading
              ? "Checking latest backup..."
              : backup?.message || "No message"}
          </p>

          {!loading && backup?.isStale && (
            <div className={`mt-3 rounded-xl ${style.bg} border ${style.border} px-3 py-2`}>
              <p className="text-xs text-amber-200/80">
                The latest backup looks old. Run the backup script or check the
                cron job.
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 w-full xl:w-auto xl:min-w-[720px]">
          <BackupMiniCard
            label="Last backup"
            value={loading ? "—" : formatDateTime(latestSnapshot?.time)}
          />

          <BackupMiniCard
            label="Age"
            value={loading ? "—" : backup?.backupAgeLabel || "Unknown"}
          />

          <BackupMiniCard
            label="Snapshots"
            value={loading ? "—" : backup?.snapshotCount ?? 0}
          />

          <BackupMiniCard
            label="Snapshot ID"
            value={loading ? "—" : latestSnapshot?.id || "—"}
            mono
          />
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 xl:grid-cols-[1fr_auto] gap-3 xl:items-center">
        <p className="text-xs text-red-300/30 font-mono break-all">
          Repository: {backup?.repository || "—"}
        </p>

        <a
          href="/api/backups"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-300 px-3 py-2 text-xs font-medium transition-all"
        >
          Open backup JSON
        </a>
      </div>

      <details className="mt-4 rounded-xl bg-[#111111] border border-red-500/10 overflow-hidden">
        <summary className="cursor-pointer px-4 py-3 text-xs font-semibold text-red-200/60 hover:text-red-100 transition-all">
          Last backup log
        </summary>

        <pre className="max-h-64 overflow-auto border-t border-red-500/10 px-4 py-3 text-[11px] leading-relaxed text-red-100/55 font-mono whitespace-pre-wrap">
          {logLines.length > 0 ? logLines.join("\n") : "No log lines found."}
        </pre>
      </details>
    </div>
  );
}

function BackupMiniCard({ label, value, mono = false }) {
  return (
    <div className="rounded-xl bg-[#111111] border border-red-500/10 p-4 min-w-0">
      <p className="text-[10px] uppercase tracking-widest text-red-300/35 font-semibold mb-1">
        {label}
      </p>

      <p
        className={`text-sm text-red-100 font-medium truncate ${
          mono ? "font-mono" : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}

function Pm2StatusPanel({ pm2, loading }) {
  const status = pm2?.status || "warning";
  const processes = pm2?.processes || [];

  const statusStyles = {
    ok: {
      label: "OK",
      dot: "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]",
      text: "text-emerald-400",
      border: "border-emerald-500/20",
    },
    warning: {
      label: "Warning",
      dot: "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.7)]",
      text: "text-amber-400",
      border: "border-amber-500/20",
    },
    error: {
      label: "Error",
      dot: "bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.7)]",
      text: "text-rose-400",
      border: "border-rose-500/20",
    },
  };

  const style = statusStyles[status] || statusStyles.warning;

  return (
    <div
      className={`rounded-2xl bg-white/[0.03] backdrop-blur-sm border ${style.border} p-4 md:p-6 mb-6 md:mb-8`}
    >
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span
              className={`inline-block w-2.5 h-2.5 rounded-full shrink-0 ${style.dot}`}
            />
            <span className={`text-xs font-mono ${style.text}`}>
              {loading ? "Loading..." : style.label}
            </span>
          </div>

          <h3 className="text-lg md:text-xl font-bold text-red-100">
            PM2 Process Status
          </h3>

          <p className="text-sm text-red-200/40 mt-1">
            {loading ? "Checking PM2 processes..." : pm2?.message || "No message"}
          </p>
        </div>

        <a
          href="/api/pm2"
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center justify-center rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-300 px-3 py-2 text-xs font-medium transition-all"
        >
          Open PM2 JSON
        </a>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {loading ? (
          <>
            <Pm2SkeletonCard />
            <Pm2SkeletonCard />
          </>
        ) : processes.length > 0 ? (
          processes.map((process) => (
            <Pm2ProcessCard key={`${process.name}-${process.id}`} process={process} />
          ))
        ) : (
          <div className="rounded-xl bg-[#111111] border border-red-500/10 p-4">
            <p className="text-sm text-red-200/50">No PM2 processes found.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function Pm2ProcessCard({ process }) {
  const isOnline = process.status === "online";

  return (
    <div className="rounded-xl bg-[#111111] border border-red-500/10 p-4 min-w-0">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-red-100 truncate">
            {process.name}
          </p>
          <p className="text-[11px] text-red-300/30 font-mono">
            ID {process.id} · PID {process.pid || "—"}
          </p>
        </div>

        <span
          className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-mono border ${
            isOnline
              ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
              : "text-rose-400 bg-rose-500/10 border-rose-500/20"
          }`}
        >
          {process.status}
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <Pm2Metric label="CPU" value={`${Number(process.cpu || 0).toFixed(1)}%`} />
        <Pm2Metric label="Memory" value={formatBytes(process.memory || 0)} />
        <Pm2Metric label="Restarts" value={process.restarts ?? 0} />
        <Pm2Metric label="Uptime" value={process.uptime || "—"} />
      </div>
    </div>
  );
}

function Pm2Metric({ label, value }) {
  return (
    <div className="rounded-lg bg-black/20 border border-red-500/5 p-2 min-w-0">
      <p className="text-[10px] uppercase tracking-widest text-red-300/30 font-semibold mb-1">
        {label}
      </p>
      <p className="text-xs text-red-100 font-mono truncate">{value}</p>
    </div>
  );
}

function Pm2SkeletonCard() {
  return (
    <div className="rounded-xl bg-[#111111] border border-red-500/10 p-4 animate-pulse">
      <div className="h-4 w-32 bg-red-500/10 rounded mb-3" />
      <div className="grid grid-cols-4 gap-2">
        <div className="h-12 bg-red-500/5 rounded-lg" />
        <div className="h-12 bg-red-500/5 rounded-lg" />
        <div className="h-12 bg-red-500/5 rounded-lg" />
        <div className="h-12 bg-red-500/5 rounded-lg" />
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, color, icon }) {
  return (
    <div className="rounded-2xl bg-white/[0.03] backdrop-blur-sm border border-red-500/10 p-4 sm:p-5 group hover:border-red-500/25 transition-all min-w-0">
      <div className="flex items-center justify-between gap-3 mb-3">
        <span className="text-xs font-medium text-red-200/50 truncate">
          {label}
        </span>

        <div
          className={`w-9 h-9 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg shadow-red-500/10 shrink-0`}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d={icon} />
          </svg>
        </div>
      </div>

      <p className="text-xl sm:text-2xl font-bold break-words">{value}</p>

      {sub && (
        <p className="text-[11px] text-red-200/30 mt-1 font-mono break-words leading-relaxed">
          {sub}
        </p>
      )}
    </div>
  );
}