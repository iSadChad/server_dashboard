"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
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

const subscribeToHydration = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="vapor-tooltip rounded-xl border border-cyan-300/25 bg-violet-950/90 px-3 py-2 text-xs shadow-[0_0_28px_rgba(34,211,238,0.18)] backdrop-blur-xl">
        <p className="mb-1 text-cyan-100/60">{label}</p>

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
  const mounted = useSyncExternalStore(
    subscribeToHydration,
    getClientSnapshot,
    getServerSnapshot
  );
  const [stats, setStats] = useState(defaultStats);
  const [loading, setLoading] = useState(true);
  const [weekData, setWeekData] = useState([]);
  const [monthData, setMonthData] = useState([]);
  const [backupStatus, setBackupStatus] = useState(defaultBackupStatus);
  const [backupLoading, setBackupLoading] = useState(true);
  const [pm2Status, setPm2Status] = useState(defaultPm2Status);
  const [pm2Loading, setPm2Loading] = useState(true);

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
    { name: "Used", value: memPercentNum || 1, color: "#ff4fd8" },
    { name: "Free", value: 100 - (memPercentNum || 1), color: "#281052" },
  ];

  const diskPieData = [
    { name: "Used", value: diskPercentNum || 1, color: "#5dfdf4" },
    { name: "Free", value: 100 - (diskPercentNum || 1), color: "#281052" },
  ];

  return (
    <div className="vapor-page dashboard-workbench w-full min-w-0 max-w-full overflow-x-clip p-2.5 min-[390px]:p-3 sm:p-4 lg:p-8">
      <div className="vapor-header page-command-header dashboard-hero relative mb-4 grid min-h-0! min-w-0 gap-3 overflow-hidden rounded-2xl! border border-fuchsia-300/20 bg-linear-to-br from-fuchsia-500/15 via-violet-500/10 to-cyan-400/10 p-4! shadow-[0_0_55px_rgba(217,70,239,0.14)] sm:mb-6 sm:gap-5 sm:rounded-3xl! sm:p-5! md:mb-8 md:grid-cols-[minmax(0,1fr)_auto] md:items-end md:p-7!">
        <div className="dashboard-hero-copy min-w-0">
          <p className="vapor-kicker mb-1.5 font-mono text-[8px] font-bold uppercase tracking-[0.2em] text-cyan-300/75 sm:mb-2 sm:text-[10px] sm:tracking-[0.3em]">
            Neon telemetry // live system
          </p>
          <h2 className="vapor-title text-2xl font-black tracking-tight text-white sm:text-3xl md:text-5xl">Dashboard</h2>
          <p className="vapor-muted mt-1 text-xs leading-relaxed text-violet-100/55 sm:mt-2 sm:text-sm">
            System pulse, analytics and service signals
          </p>
        </div>

        <div className="dashboard-hero-readouts grid w-full grid-cols-2 gap-2 md:w-auto md:min-w-72">
          <div className="vapor-chip flex min-h-0! min-w-0 items-center gap-1.5 rounded-xl border border-cyan-300/25 bg-cyan-300/10 px-3 py-2.5 font-mono text-[10px] uppercase tracking-wide text-cyan-100 sm:gap-2 sm:rounded-2xl sm:px-4 sm:py-3 sm:text-xs sm:tracking-wider">
            <div className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(103,232,249,0.85)]" />
            <span className="truncate">
              Live · {loading ? "..." : `${stats.cpu.toFixed(0)}% CPU`}
            </span>
          </div>

          <div className="dashboard-hero-uptime min-h-0! min-w-0 rounded-xl border border-fuchsia-300/20 bg-fuchsia-400/8 px-3 py-2.5 sm:rounded-2xl sm:px-4 sm:py-3">
            <p className="truncate font-mono text-[8px] font-bold uppercase tracking-[0.12em] text-fuchsia-200/45 sm:text-[9px] sm:tracking-[0.2em]">
              Session uptime
            </p>
            <p className="mt-1 truncate font-mono text-[10px] text-fuchsia-50 sm:text-xs">
              {loading ? "Synchronizing" : `${uptimeHours}h ${uptimeMinutes}m`}
            </p>
          </div>
        </div>
      </div>

      <section className="dashboard-metric-deck mb-5 min-w-0 sm:mb-6 md:mb-8">
        <div className="dashboard-section-label mb-2.5 flex min-w-0 items-center justify-between gap-2 px-1 sm:mb-3 sm:gap-4">
          <p className="shrink-0 whitespace-nowrap font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-cyan-200/50 sm:text-[10px] sm:tracking-[0.24em]">
            01 // Instant telemetry
          </p>
          <span className="h-px flex-1 bg-linear-to-r from-fuchsia-300/20 to-transparent" />
        </div>

        <div className="dashboard-metrics grid min-w-0 grid-cols-2 gap-2 sm:gap-3 md:gap-4 xl:grid-cols-4">
        <StatCard
          label="CPU Usage"
          value={loading ? "—" : `${stats.cpu.toFixed(1)}%`}
          sub={loading ? "" : "Current load"}
          color="from-fuchsia-500 to-violet-600"
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
          color="from-pink-400 to-fuchsia-600"
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
          color="from-violet-500 to-cyan-500"
          icon="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"
        />

        <StatCard
          label="Uptime"
          value={loading ? "—" : `${uptimeHours}h ${uptimeMinutes}m`}
          sub="Since last boot"
          color="from-cyan-400 to-violet-600"
          icon="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
        />
        </div>
      </section>

      <section className="dashboard-analytics mb-5 min-w-0 sm:mb-6 md:mb-8">
        <div className="dashboard-section-label mb-2.5 flex min-w-0 items-center justify-between gap-2 px-1 sm:mb-3 sm:gap-4">
          <p className="shrink-0 whitespace-nowrap font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-fuchsia-200/50 sm:text-[10px] sm:tracking-[0.24em]">
            02 // Signal cockpit
          </p>
          <span className="h-px flex-1 bg-linear-to-r from-cyan-300/20 to-transparent" />
        </div>

        <div className="dashboard-analytics-grid grid min-w-0 grid-cols-1 gap-3 sm:gap-4 xl:grid-cols-12">
        <div className="vapor-panel dashboard-network-module min-w-0 max-w-full overflow-hidden rounded-2xl border border-fuchsia-300/20 bg-violet-950/30 p-4 shadow-[0_24px_70px_rgba(30,0,65,0.25)] backdrop-blur-xl sm:rounded-3xl sm:p-5 md:p-6 xl:col-span-8">
          <div className="mb-3 flex min-w-0 flex-col gap-1.5 sm:mb-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between sm:gap-3">
            <div>
              <p className="vapor-kicker mb-1 font-mono text-[9px] font-bold uppercase tracking-[0.22em] text-fuchsia-200/45">
                Long-range transmission
              </p>
              <h3 className="text-sm font-bold uppercase tracking-wider text-fuchsia-100">
                Network Activity
              </h3>
            </div>
            <p className="vapor-muted font-mono text-[9px] text-violet-100/40 sm:text-[10px]">
              Inbound / Outbound · 12 months
            </p>
          </div>

          {mounted ? (
            <div className="dashboard-network-chart h-52 min-w-0 max-w-full overflow-hidden min-[390px]:h-56 sm:h-72">
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
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
                        stopColor="#5dfdf4"
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="95%"
                        stopColor="#5dfdf4"
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
                        stopColor="#ff4fd8"
                        stopOpacity={0.3}
                      />
                      <stop
                        offset="95%"
                        stopColor="#ff4fd8"
                        stopOpacity={0}
                      />
                    </linearGradient>
                  </defs>

                  <XAxis
                    dataKey="month"
                    interval="preserveStartEnd"
                    minTickGap={14}
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#aa93d4", fontSize: 11 }}
                  />

                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#aa93d4", fontSize: 11 }}
                    width={32}
                  />

                  <Tooltip content={<CustomTooltip />} />

                  <Area
                    type="monotone"
                    dataKey="inbound"
                    stroke="#5dfdf4"
                    fill="url(#gradInbound)"
                    strokeWidth={2}
                    name="Inbound"
                    isAnimationActive={false}
                  />

                  <Area
                    type="monotone"
                    dataKey="outbound"
                    stroke="#ff4fd8"
                    fill="url(#gradOutbound)"
                    strokeWidth={2}
                    name="Outbound"
                    isAnimationActive={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-52 w-full animate-pulse rounded-2xl bg-fuchsia-400/5 min-[390px]:h-56 sm:h-72" />
          )}
        </div>

        <div className="vapor-panel dashboard-resource-module min-w-0 max-w-full overflow-hidden rounded-2xl border border-cyan-300/20 bg-linear-to-br from-cyan-400/8 to-violet-500/12 p-4 shadow-[0_24px_70px_rgba(30,0,65,0.25)] backdrop-blur-xl sm:rounded-3xl sm:p-5 md:p-6 xl:col-span-4">
          <div className="mb-3 sm:mb-4">
            <p className="vapor-kicker mb-1 font-mono text-[9px] font-bold uppercase tracking-[0.22em] text-cyan-200/45">
              Capacity matrix
            </p>
            <h3 className="text-sm font-bold uppercase tracking-wider text-cyan-100">
              Resource Balance
            </h3>
          </div>

          <div className="dashboard-resource-rings grid min-w-0 grid-cols-1 gap-2.5 min-[360px]:grid-cols-2 sm:gap-3">
            <div className="dashboard-resource-ring min-w-0 overflow-hidden rounded-2xl border border-fuchsia-300/15 bg-violet-950/40 p-2.5 sm:p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-fuchsia-100/65">
                  Memory
                </p>
                <span className="h-1.5 w-1.5 rounded-full bg-fuchsia-400 shadow-[0_0_8px_rgba(232,121,249,0.75)]" />
              </div>

              {mounted ? (
                <div className="dashboard-ring-chart relative h-32 min-w-0 sm:h-36">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <PieChart>
                      <Pie
                        data={memPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius="54%"
                        outerRadius="78%"
                        paddingAngle={4}
                        dataKey="value"
                        stroke="none"
                        isAnimationActive={false}
                      >
                        {memPieData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <span className="font-mono text-base font-black text-fuchsia-50">
                      {memPercent}%
                    </span>
                  </div>
                </div>
              ) : (
                <div className="h-32 w-full animate-pulse rounded-2xl bg-fuchsia-400/5 sm:h-36" />
              )}

              <p className="truncate text-center font-mono text-[9px] text-fuchsia-100/40">
                {loading
                  ? "Synchronizing"
                  : `${formatBytes(stats.memory.used)} used`}
              </p>
            </div>

            <div className="dashboard-resource-ring min-w-0 overflow-hidden rounded-2xl border border-cyan-300/15 bg-violet-950/40 p-2.5 sm:p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="font-mono text-[10px] font-bold uppercase tracking-wider text-cyan-100/65">
                  Disk
                </p>
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-300 shadow-[0_0_8px_rgba(103,232,249,0.75)]" />
              </div>

              {mounted ? (
                <div className="dashboard-ring-chart relative h-32 min-w-0 sm:h-36">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <PieChart>
                      <Pie
                        data={diskPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius="54%"
                        outerRadius="78%"
                        paddingAngle={4}
                        dataKey="value"
                        stroke="none"
                        isAnimationActive={false}
                      >
                        {diskPieData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <span className="font-mono text-base font-black text-cyan-50">
                      {diskPercent}%
                    </span>
                  </div>
                </div>
              ) : (
                <div className="h-32 w-full animate-pulse rounded-2xl bg-cyan-400/5 sm:h-36" />
              )}

              <p className="truncate text-center font-mono text-[9px] text-cyan-100/40">
                {loading
                  ? "Synchronizing"
                  : `${formatBytes(stats.disk.used)} used`}
              </p>
            </div>
          </div>

          <div className="dashboard-resource-footer mt-2.5 grid min-w-0 grid-cols-2 gap-2 sm:mt-3">
            <div className="min-w-0 rounded-xl border border-fuchsia-300/10 bg-fuchsia-400/5 px-2.5 py-2 sm:px-3">
              <p className="font-mono text-[8px] uppercase tracking-wider text-fuchsia-200/35">
                Memory free
              </p>
              <p className="mt-1 font-mono text-xs text-fuchsia-50/75">
                {(100 - memPercentNum).toFixed(1)}%
              </p>
            </div>
            <div className="min-w-0 rounded-xl border border-cyan-300/10 bg-cyan-300/5 px-2.5 py-2 sm:px-3">
              <p className="font-mono text-[8px] uppercase tracking-wider text-cyan-200/35">
                Disk free
              </p>
              <p className="mt-1 font-mono text-xs text-cyan-50/75">
                {(100 - diskPercentNum).toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
        </div>
      </section>

      <section className="dashboard-weekly mb-5 min-w-0 sm:mb-6 md:mb-8">
        <div className="dashboard-section-label mb-2.5 flex min-w-0 items-center justify-between gap-2 px-1 sm:mb-3 sm:gap-4">
          <p className="shrink-0 whitespace-nowrap font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-cyan-200/50 sm:text-[10px] sm:tracking-[0.24em]">
            03 // Seven-day rhythm
          </p>
          <span className="h-px flex-1 bg-linear-to-r from-fuchsia-300/20 to-transparent" />
        </div>

        <div className="vapor-panel dashboard-weekly-module min-w-0 max-w-full overflow-hidden rounded-2xl border border-fuchsia-300/18 bg-violet-950/30 p-4 shadow-[0_20px_55px_rgba(30,0,65,0.2)] backdrop-blur-xl sm:rounded-3xl sm:p-5 md:p-6">
          <div className="mb-4 flex min-w-0 flex-col gap-2.5 sm:mb-5 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between sm:gap-3">
            <div className="min-w-0">
              <h3 className="text-sm font-bold uppercase tracking-wider text-fuchsia-100">
                Utilization Rhythm
              </h3>
              <p className="vapor-muted mt-1 text-[11px] text-violet-100/40">
                CPU and memory averages shown as one weekly sequence
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 font-mono text-[9px] uppercase tracking-wider text-violet-100/45 sm:gap-4">
              <span className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-fuchsia-400" />
                CPU
              </span>
              <span className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-300" />
                Memory
              </span>
            </div>
          </div>

          <div className="dashboard-weekly-grid grid min-w-0 grid-cols-1 gap-3 lg:grid-cols-2">
            <div className="dashboard-weekly-chart min-w-0 max-w-full overflow-hidden rounded-2xl border border-fuchsia-300/12 bg-fuchsia-400/4 p-3 sm:p-4">
              <p className="mb-3 font-mono text-[10px] font-bold uppercase tracking-wider text-fuchsia-100/60">
                CPU load
              </p>
              {mounted ? (
                <div className="h-40 min-w-0 max-w-full overflow-hidden sm:h-44">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <BarChart data={weekData} barCategoryMaxWidth={16}>
                      <XAxis
                        dataKey="day"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#aa93d4", fontSize: 10 }}
                      />

                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#aa93d4", fontSize: 10 }}
                        width={30}
                      />

                      <Tooltip content={<CustomTooltip />} />

                      <Bar
                        dataKey="cpu"
                        fill="#ff4fd8"
                        radius={[4, 4, 0, 0]}
                        name="CPU"
                        isAnimationActive={false}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-40 w-full animate-pulse rounded-2xl bg-fuchsia-400/5 sm:h-44" />
              )}
            </div>

            <div className="dashboard-weekly-chart min-w-0 max-w-full overflow-hidden rounded-2xl border border-cyan-300/12 bg-cyan-300/4 p-3 sm:p-4">
              <p className="mb-3 font-mono text-[10px] font-bold uppercase tracking-wider text-cyan-100/60">
                Memory load
              </p>
              {mounted ? (
                <div className="h-40 min-w-0 max-w-full overflow-hidden sm:h-44">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <BarChart data={weekData} barCategoryMaxWidth={16}>
                      <XAxis
                        dataKey="day"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#aa93d4", fontSize: 10 }}
                      />

                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: "#aa93d4", fontSize: 10 }}
                        width={30}
                      />

                      <Tooltip content={<CustomTooltip />} />

                      <Bar
                        dataKey="mem"
                        fill="#5dfdf4"
                        radius={[4, 4, 0, 0]}
                        name="Memory"
                        isAnimationActive={false}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-40 w-full animate-pulse rounded-2xl bg-cyan-400/5 sm:h-44" />
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="dashboard-operations min-w-0">
        <div className="dashboard-section-label mb-2.5 flex min-w-0 items-center justify-between gap-2 px-1 sm:mb-3 sm:gap-4">
          <p className="shrink-0 whitespace-nowrap font-mono text-[9px] font-bold uppercase tracking-[0.14em] text-fuchsia-200/50 sm:text-[10px] sm:tracking-[0.24em]">
            04 // Operations bay
          </p>
          <span className="h-px flex-1 bg-linear-to-r from-cyan-300/20 to-transparent" />
        </div>

        <div className="dashboard-operations-grid grid min-w-0 grid-cols-1 gap-3 sm:gap-4 2xl:grid-cols-12">
          <div className="dashboard-backup-cell min-w-0 2xl:col-span-7">
            <BackupStatusPanel backup={backupStatus} loading={backupLoading} />
          </div>
          <div className="dashboard-pm2-cell min-w-0 2xl:col-span-5">
            <Pm2StatusPanel pm2={pm2Status} loading={pm2Loading} />
          </div>
        </div>
      </section>
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
      className={`vapor-panel vapor-status-panel dashboard-backup-panel h-full min-w-0 max-w-full overflow-hidden rounded-2xl border bg-linear-to-br from-fuchsia-500/8 to-violet-950/35 p-4 shadow-[0_24px_70px_rgba(30,0,65,0.24)] backdrop-blur-xl sm:rounded-3xl sm:p-5 md:p-6 ${style.border}`}
    >
      <div className="flex min-w-0 flex-col gap-4 sm:gap-5">
        <div className="min-w-0">
          <div className="mb-2 flex min-w-0 flex-wrap items-center gap-2">
            <span
              className={`inline-block w-2.5 h-2.5 rounded-full shrink-0 ${style.dot}`}
            />
            <span className={`text-xs font-mono ${style.text}`}>
              {loading ? "Loading..." : style.label}
            </span>

            {!loading && backup?.backupAgeLabel && (
              <span className="min-w-0 truncate font-mono text-xs text-violet-100/40">
                · {backup.backupAgeLabel}
              </span>
            )}
          </div>

          <h3 className="text-xl font-black tracking-tight text-fuchsia-50 md:text-2xl">
            Backup Status
          </h3>

          <p className="vapor-muted mt-1 text-sm text-violet-100/45">
            {loading
              ? "Checking latest backup..."
              : backup?.message || "No message"}
          </p>

          {!loading && backup?.isStale && (
            <div className={`mt-3 rounded-2xl border px-3 py-2 ${style.bg} ${style.border}`}>
              <p className="text-xs text-amber-200/80">
                The latest backup looks old. Run the backup script or check the
                cron job.
              </p>
            </div>
          )}
        </div>

        <div className="grid w-full min-w-0 grid-cols-2 gap-2 sm:gap-3 xl:grid-cols-4">
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

      <div className="mt-4 grid min-w-0 grid-cols-1 gap-2 sm:gap-3 xl:grid-cols-[1fr_auto] xl:items-center">
        <p className="min-w-0 break-all font-mono text-[10px] leading-relaxed text-cyan-100/35 sm:text-xs">
          Repository: {backup?.repository || "—"}
        </p>

        <a
          href="/api/backups"
          target="_blank"
          rel="noreferrer"
          className="vapor-button inline-flex w-full items-center justify-center rounded-xl border border-cyan-300/25 bg-cyan-300/10 px-3 py-2.5 text-xs font-bold text-cyan-100 transition-all duration-300 hover:-translate-y-0.5 hover:border-fuchsia-200/45 hover:bg-fuchsia-400/15 xl:w-auto xl:py-2"
        >
          Open backup JSON
        </a>
      </div>

      <details className="vapor-details mt-4 overflow-hidden rounded-2xl border border-fuchsia-300/15 bg-violet-950/55">
        <summary className="cursor-pointer px-3 py-3 text-xs font-bold text-fuchsia-100/65 transition-all hover:text-cyan-100 sm:px-4">
          Last backup log
        </summary>

        <pre className="max-h-64 max-w-full overflow-auto whitespace-pre-wrap wrap-break-word border-t border-fuchsia-200/10 px-3 py-3 font-mono text-[10px] leading-relaxed text-violet-50/55 sm:px-4 sm:text-[11px]">
          {logLines.length > 0 ? logLines.join("\n") : "No log lines found."}
        </pre>
      </details>
    </div>
  );
}

function BackupMiniCard({ label, value, mono = false }) {
  return (
    <div className="vapor-subpanel min-w-0 overflow-hidden rounded-xl border border-fuchsia-300/15 bg-violet-950/55 p-3 sm:rounded-2xl sm:p-4">
      <p className="vapor-kicker mb-1 truncate text-[9px] font-bold uppercase tracking-[0.12em] text-cyan-200/45 sm:text-[10px] sm:tracking-[0.22em]">
        {label}
      </p>

      <p
        className={`truncate text-xs font-bold text-fuchsia-50 sm:text-sm ${
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
      className={`vapor-panel vapor-status-panel dashboard-pm2-panel h-full min-w-0 max-w-full overflow-hidden rounded-2xl border bg-linear-to-br from-cyan-400/7 to-violet-950/35 p-4 shadow-[0_24px_70px_rgba(30,0,65,0.24)] backdrop-blur-xl sm:rounded-3xl sm:p-5 md:p-6 ${style.border}`}
    >
      <div className="mb-4 flex min-w-0 flex-col gap-3 sm:gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <div className="mb-2 flex min-w-0 flex-wrap items-center gap-2">
            <span
              className={`inline-block w-2.5 h-2.5 rounded-full shrink-0 ${style.dot}`}
            />
            <span className={`text-xs font-mono ${style.text}`}>
              {loading ? "Loading..." : style.label}
            </span>
          </div>

          <h3 className="text-xl font-black tracking-tight text-cyan-50 md:text-2xl">
            PM2 Process Status
          </h3>

          <p className="vapor-muted mt-1 wrap-break-word text-xs leading-relaxed text-violet-100/45 sm:text-sm">
            {loading ? "Checking PM2 processes..." : pm2?.message || "No message"}
          </p>
        </div>

        <a
          href="/api/pm2"
          target="_blank"
          rel="noreferrer"
          className="vapor-button inline-flex w-full shrink-0 items-center justify-center rounded-xl border border-fuchsia-300/25 bg-fuchsia-400/10 px-3 py-2.5 text-xs font-bold text-fuchsia-100 transition-all duration-300 hover:-translate-y-0.5 hover:border-cyan-200/45 hover:bg-cyan-300/10 md:w-auto md:py-2"
        >
          Open PM2 JSON
        </a>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 2xl:grid-cols-1">
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
          <div className="vapor-empty rounded-2xl border border-fuchsia-300/15 bg-violet-950/55 p-4">
            <p className="text-sm text-violet-100/50">No PM2 processes found.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function Pm2ProcessCard({ process }) {
  const isOnline = process.status === "online";

  return (
    <div className="vapor-list-row min-w-0 max-w-full overflow-hidden rounded-2xl border border-fuchsia-300/15 bg-violet-950/55 p-3 transition-all duration-300 hover:-translate-y-0.5 hover:border-cyan-200/30 hover:bg-cyan-300/5 sm:p-4">
      <div className="mb-3 flex min-w-0 items-start justify-between gap-2 sm:gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-fuchsia-50">
            {process.name}
          </p>
          <p className="wrap-break-word font-mono text-[10px] text-cyan-100/35 sm:text-[11px]">
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

      <div className="grid min-w-0 grid-cols-2 gap-1.5 sm:grid-cols-4 sm:gap-2">
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
    <div className="min-w-0 overflow-hidden rounded-xl border border-cyan-300/8 bg-violet-950/45 p-2 sm:p-2.5">
      <p className="vapor-kicker mb-1 truncate text-[9px] font-bold uppercase tracking-[0.12em] text-cyan-200/40 sm:text-[10px] sm:tracking-[0.18em]">
        {label}
      </p>
      <p className="truncate font-mono text-xs text-fuchsia-50">{value}</p>
    </div>
  );
}

function Pm2SkeletonCard() {
  return (
    <div className="min-w-0 animate-pulse overflow-hidden rounded-2xl border border-fuchsia-300/15 bg-violet-950/55 p-3 sm:p-4">
      <div className="mb-3 h-4 w-32 rounded bg-fuchsia-400/10" />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <div className="h-12 rounded-lg bg-fuchsia-400/5" />
        <div className="h-12 rounded-lg bg-cyan-400/5" />
        <div className="h-12 rounded-lg bg-fuchsia-400/5" />
        <div className="h-12 rounded-lg bg-cyan-400/5" />
      </div>
    </div>
  );
}

function StatCard({ label, value, sub, color, icon }) {
  return (
    <div className="vapor-card group min-h-0! min-w-0 overflow-hidden rounded-2xl border border-fuchsia-300/20 bg-linear-to-br from-fuchsia-500/10 to-cyan-400/5 p-3! shadow-[0_18px_45px_rgba(30,0,70,0.2)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-cyan-200/35 hover:shadow-[0_22px_55px_rgba(34,211,238,0.1)] sm:rounded-3xl sm:p-5!">
      <div className="mb-2 flex min-w-0 items-center justify-between gap-2 sm:mb-3 sm:gap-3">
        <span className="vapor-kicker min-w-0 truncate font-mono text-[8px] font-bold uppercase tracking-[0.12em] text-cyan-200/55 min-[390px]:text-[9px] sm:text-[10px] sm:tracking-[0.2em]">
          {label}
        </span>

        <div
          className={`vapor-icon flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-linear-to-br shadow-[0_0_22px_rgba(217,70,239,0.25)] transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110 sm:h-11 sm:w-11 sm:rounded-2xl ${color}`}
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

      <p className="wrap-break-word text-xl font-black tracking-tight text-fuchsia-50 min-[390px]:text-2xl sm:text-3xl">{value}</p>

      {sub && (
        <p className="vapor-muted mt-1 wrap-break-word font-mono text-[9px] leading-snug text-violet-100/40 sm:text-[11px] sm:leading-relaxed">
          {sub}
        </p>
      )}
    </div>
  );
}
