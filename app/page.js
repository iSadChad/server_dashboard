"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import PageLayout, { usePageLayout } from "../components/PageLayout";
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

function DashboardContent() {
  const { sidebarCollapsed } = usePageLayout();
  const [mounted, setMounted] = useState(false);
  const [stats, setStats] = useState(defaultStats);
  const [loading, setLoading] = useState(true);
  const [weekData, setWeekData] = useState([]);
  const [monthData, setMonthData] = useState([]);

  const [chartWidths, setChartWidths] = useState({
    network: 600,
    memoryPie: 280,
    cpuBar: 280,
    memBar: 280,
    diskPie: 280,
  });

  const networkRef = useRef(null);
  const memPieRef = useRef(null);
  const cpuBarRef = useRef(null);
  const memBarRef = useRef(null);
  const diskPieRef = useRef(null);

  const measure = useCallback(() => {
    function getWidth(ref, fallback, padding = 48, min = 220) {
      return Math.max(min, (ref.current?.clientWidth || fallback) - padding);
    }

    setChartWidths({
      network: getWidth(networkRef, 648),
      memoryPie: getWidth(memPieRef, 328),
      cpuBar: getWidth(cpuBarRef, 328),
      memBar: getWidth(memBarRef, 328),
      diskPie: getWidth(diskPieRef, 328),
    });
  }, []);

  useEffect(() => {
    setMounted(true);
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure]);

  useEffect(() => {
    const timeout = setTimeout(measure, 250);
    return () => clearTimeout(timeout);
  }, [sidebarCollapsed, measure]);

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
      } catch (e) {
        console.error("Failed to fetch charts:", e);
      }
    }

    fetchStats();
    fetchCharts();

    const statsInterval = setInterval(fetchStats, 5000);
    const chartsInterval = setInterval(fetchCharts, 60000);

    return () => {
      clearInterval(statsInterval);
      clearInterval(chartsInterval);
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
    <div className="p-4 md:p-8">
      <div className="flex items-center justify-between mb-6 md:mb-8">
        <div>
          <h2 className="text-xl md:text-2xl font-bold">Dashboard</h2>
          <p className="text-red-200/40 text-sm mt-1">
            System overview and analytics
          </p>
        </div>

        <div className="hidden sm:flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs text-red-200/40 font-mono bg-[#111111] rounded-lg px-3 py-2 border border-red-500/10">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live · {loading ? "..." : `${stats.cpu.toFixed(0)}% CPU`}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-4 mb-6 md:mb-8">
        <div
          className="lg:col-span-2 rounded-2xl bg-white/[0.03] backdrop-blur-sm border border-red-500/10 p-4 md:p-6 min-w-0"
          ref={networkRef}
        >
          <h3 className="text-sm font-semibold text-red-200/70 mb-1">
            Network Activity
          </h3>
          <p className="text-[11px] text-red-300/30 mb-4">
            Inbound vs Outbound over 12 months
          </p>

          {mounted ? (
            <ResponsiveContainer width="100%" height={260}>
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
          ) : (
            <div className="w-full h-[260px] animate-pulse rounded-lg bg-red-500/5" />
          )}
        </div>

        <div
          className="rounded-2xl bg-white/[0.03] backdrop-blur-sm border border-red-500/10 p-4 md:p-6 min-w-0"
          ref={memPieRef}
        >
          <h3 className="text-sm font-semibold text-red-200/70 mb-1">
            Memory Split
          </h3>
          <p className="text-[11px] text-red-300/30 mb-4">
            Used vs Free
          </p>

          {mounted ? (
            <PieChart width={chartWidths.memoryPie} height={180}>
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
          ) : (
            <div className="w-full h-[180px] animate-pulse rounded-lg bg-red-500/5" />
          )}

          <div className="flex justify-center gap-4 mt-2">
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        <div
          className="rounded-2xl bg-white/[0.03] backdrop-blur-sm border border-red-500/10 p-4 md:p-6 min-w-0"
          ref={cpuBarRef}
        >
          <h3 className="text-sm font-semibold text-red-200/70 mb-1">
            Weekly CPU
          </h3>
          <p className="text-[11px] text-red-300/30 mb-4">
            Avg usage by day
          </p>

          {mounted ? (
            <ResponsiveContainer width="100%" height={160}>
            <BarChart
            data={weekData}
            barCategoryMaxWidth={16}
              >
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
          ) : (
            <div className="w-full h-[160px] animate-pulse rounded-lg bg-red-500/5" />
          )}
        </div>

        <div
          className="rounded-2xl bg-white/[0.03] backdrop-blur-sm border border-red-500/10 p-4 md:p-6 min-w-0"
          ref={memBarRef}
        >
          <h3 className="text-sm font-semibold text-red-200/70 mb-1">
            Weekly Memory
          </h3>
          <p className="text-[11px] text-red-300/30 mb-4">
            Avg usage by day
          </p>

          {mounted ? (
            <ResponsiveContainer width="100%" height={160}>
            <BarChart
            data={weekData}
            barCategoryMaxWidth={16}
            >
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
          ) : (
            <div className="w-full h-[160px] animate-pulse rounded-lg bg-red-500/5" />
          )}
        </div>

        <div
          className="rounded-2xl bg-white/[0.03] backdrop-blur-sm border border-red-500/10 p-4 md:p-6 min-w-0"
          ref={diskPieRef}
        >
          <h3 className="text-sm font-semibold text-red-200/70 mb-1">
            Disk Usage
          </h3>
          <p className="text-[11px] text-red-300/30 mb-4">
            Used vs Free
          </p>

          {mounted ? (
            <PieChart width={chartWidths.diskPie} height={180}>
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
          ) : (
            <div className="w-full h-[180px] animate-pulse rounded-lg bg-red-500/5" />
          )}

          <div className="flex justify-center gap-4 mt-2">
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

function StatCard({ label, value, sub, color, icon }) {
  return (
    <div className="rounded-2xl bg-white/[0.03] backdrop-blur-sm border border-red-500/10 p-5 group hover:border-red-500/25 transition-all">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-red-200/50">{label}</span>

        <div
          className={`w-9 h-9 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg shadow-red-500/10`}
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

      <p className="text-2xl font-bold">{value}</p>

      {sub && (
        <p className="text-[11px] text-red-200/30 mt-1 font-mono">{sub}</p>
      )}
    </div>
  );
}