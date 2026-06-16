"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
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

const defaultStats = { cpu: 0, memory: { used: 0, total: 0 }, disk: { used: 0, total: 0 }, uptime: 0 };

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#1a1444]/90 backdrop-blur border border-purple-500/20 rounded-lg px-3 py-2 text-xs shadow-lg">
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

function Clock() {
  const [time, setTime] = useState("");

  useEffect(() => {
    function update() {
      const now = new Date();
      setTime(now.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) + " · " + now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    }
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return <>{time}</>;
}

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [stats, setStats] = useState(defaultStats);
  const [loading, setLoading] = useState(true);
  const [weekData, setWeekData] = useState([]);
  const [monthData, setMonthData] = useState([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [chartWidths, setChartWidths] = useState({ network: 600, memoryPie: 280, cpuBar: 280, memBar: 280, diskPie: 280 });
  const networkRef = useRef(null);
  const memPieRef = useRef(null);
  const cpuBarRef = useRef(null);
  const memBarRef = useRef(null);
  const diskPieRef = useRef(null);

  const measure = useCallback(() => {
    setChartWidths({
      network: (networkRef.current?.clientWidth || 648) - 48,
      memoryPie: (memPieRef.current?.clientWidth || 328) - 48,
      cpuBar: (cpuBarRef.current?.clientWidth || 328) - 48,
      memBar: (memBarRef.current?.clientWidth || 328) - 48,
      diskPie: (diskPieRef.current?.clientWidth || 328) - 48,
    });
  }, []);

  useEffect(() => {
    setMounted(true);
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [measure]);

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
        const res = await fetch("/api/charts");
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
    { name: "Used", value: memPercentNum || 1, color: "#8b5cf6" },
    { name: "Free", value: 100 - (memPercentNum || 1), color: "#1e1b4b" },
  ];

  const diskPieData = [
    { name: "Used", value: diskPercentNum || 1, color: "#6366f1" },
    { name: "Free", value: 100 - (diskPercentNum || 1), color: "#1e1b4b" },
  ];

  return (
    <div className="flex min-h-screen bg-[#0c0a1d] text-white">
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-black/60 md:hidden" onClick={() => setMobileMenuOpen(false)} />
      )}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#110e28] border-r border-purple-500/10 flex flex-col shrink-0 transform transition-transform duration-200 md:relative md:translate-x-0 ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}>
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
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all ${
                item.href === "/"
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

        <div className="p-4 border-t border-purple-500/10">
          <div className="rounded-xl bg-gradient-to-br from-violet-500/10 to-indigo-500/10 border border-purple-500/15 p-4">
            <p className="text-xs font-medium text-purple-200/70">System Status</p>
            <div className="flex items-center gap-2 mt-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]" />
              <span className="text-xs text-emerald-400">Online</span>
            </div>
            <p className="text-[10px] text-purple-300/30 mt-2 font-mono">
              {loading ? "Loading..." : `Uptime: ${uptimeHours}h ${uptimeMinutes}m`}
            </p>
          </div>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="p-4 md:p-8">
          <div className="flex items-center justify-between mb-6 md:mb-8">
            <div className="flex items-center gap-3">
              <button className="md:hidden p-2 rounded-lg bg-[#110e28] border border-purple-500/10 text-purple-200/60" onClick={() => setMobileMenuOpen(true)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div>
                <h2 className="text-xl md:text-2xl font-bold">Dashboard</h2>
                <p className="text-purple-200/40 text-sm mt-1">System overview and analytics</p>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-3">
              <div className="text-xs text-purple-200/40 font-mono bg-[#110e28] rounded-lg px-3 py-2 border border-purple-500/10">
                <Clock />
              </div>
              <div className="flex items-center gap-2 text-xs text-purple-200/40 font-mono bg-[#110e28] rounded-lg px-3 py-2 border border-purple-500/10">
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
              color="from-violet-500 to-purple-600"
              icon="M9 3v2m6-2v2M9 19v2m6-2v2M5.8 5.8l1.4 1.4M16.2 16.8l1.4 1.4M3 9h2m14 0h2M3 15h2m14 0h2M5.8 18.2l1.4-1.4M16.2 7.2l1.4-1.4M9 9h6v6H9z"
            />
            <StatCard
              label="Memory"
              value={loading ? "—" : `${memPercent}%`}
              sub={loading ? "" : `${formatBytes(stats.memory.used)} / ${formatBytes(stats.memory.total)}`}
              color="from-indigo-500 to-blue-600"
              icon="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
            <StatCard
              label="Disk"
              value={loading ? "—" : `${diskPercent}%`}
              sub={loading ? "" : `${formatBytes(stats.disk.used)} / ${formatBytes(stats.disk.total)}`}
              color="from-purple-500 to-pink-600"
              icon="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"
            />
            <StatCard
              label="Uptime"
              value={loading ? "—" : `${uptimeHours}h ${uptimeMinutes}m`}
              sub="Since last boot"
              color="from-fuchsia-500 to-purple-600"
              icon="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 md:gap-4 mb-6 md:mb-8">
            <div className="lg:col-span-2 rounded-2xl bg-[#110e28] border border-purple-500/10 p-4 md:p-6 min-w-0" ref={networkRef}>
              <h3 className="text-sm font-semibold text-purple-200/70 mb-1">Network Activity</h3>
              <p className="text-[11px] text-purple-300/30 mb-4">Inbound vs Outbound over 12 months</p>
              {mounted ? (
              <AreaChart width={chartWidths.network} height={260} data={monthData} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                <defs>
                  <linearGradient id="gradInbound" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradOutbound" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#6b5fb5", fontSize: 11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#6b5fb5", fontSize: 11 }} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="inbound" stroke="#8b5cf6" fill="url(#gradInbound)" strokeWidth={2} name="Inbound" />
                <Area type="monotone" dataKey="outbound" stroke="#6366f1" fill="url(#gradOutbound)" strokeWidth={2} name="Outbound" />
              </AreaChart>
              ) : <div className="w-full h-[260px] animate-pulse rounded-lg bg-purple-500/5" />}
            </div>

            <div className="rounded-2xl bg-[#110e28] border border-purple-500/10 p-4 md:p-6 min-w-0" ref={memPieRef}>
              <h3 className="text-sm font-semibold text-purple-200/70 mb-1">Memory Split</h3>
              <p className="text-[11px] text-purple-300/30 mb-4">Used vs Free</p>
              {mounted ? (
              <PieChart width={chartWidths.memoryPie} height={180}>
                <Pie data={memPieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={4} dataKey="value" stroke="none">
                  {memPieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
              ) : <div className="w-full h-[180px] animate-pulse rounded-lg bg-purple-500/5" />}
              <div className="flex justify-center gap-4 mt-2">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-violet-500" />
                  <span className="text-[11px] text-purple-200/50">Used {memPercent}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#1e1b4b]" />
                  <span className="text-[11px] text-purple-200/50">Free</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            <div className="rounded-2xl bg-[#110e28] border border-purple-500/10 p-4 md:p-6 min-w-0" ref={cpuBarRef}>
              <h3 className="text-sm font-semibold text-purple-200/70 mb-1">Weekly CPU</h3>
              <p className="text-[11px] text-purple-300/30 mb-4">Avg usage by day</p>
              {mounted ? (
              <BarChart width={chartWidths.cpuBar} height={160} data={weekData} barCategoryMaxWidth={16}>
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "#6b5fb5", fontSize: 10 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#6b5fb5", fontSize: 10 }} width={30} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="cpu" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="CPU" />
              </BarChart>
              ) : <div className="w-full h-[160px] animate-pulse rounded-lg bg-purple-500/5" />}
            </div>

            <div className="rounded-2xl bg-[#110e28] border border-purple-500/10 p-4 md:p-6 min-w-0" ref={memBarRef}>
              <h3 className="text-sm font-semibold text-purple-200/70 mb-1">Weekly Memory</h3>
              <p className="text-[11px] text-purple-300/30 mb-4">Avg usage by day</p>
              {mounted ? (
              <BarChart width={chartWidths.memBar} height={160} data={weekData} barCategoryMaxWidth={16}>
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "#6b5fb5", fontSize: 10 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#6b5fb5", fontSize: 10 }} width={30} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="mem" fill="#6366f1" radius={[4, 4, 0, 0]} name="Memory" />
              </BarChart>
              ) : <div className="w-full h-[160px] animate-pulse rounded-lg bg-purple-500/5" />}
            </div>

            <div className="rounded-2xl bg-[#110e28] border border-purple-500/10 p-4 md:p-6 min-w-0" ref={diskPieRef}>
              <h3 className="text-sm font-semibold text-purple-200/70 mb-1">Disk Usage</h3>
              <p className="text-[11px] text-purple-300/30 mb-4">Used vs Free</p>
              {mounted ? (
              <PieChart width={chartWidths.diskPie} height={180}>
                <Pie data={diskPieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={4} dataKey="value" stroke="none">
                  {diskPieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
              ) : <div className="w-full h-[180px] animate-pulse rounded-lg bg-purple-500/5" />}
              <div className="flex justify-center gap-4 mt-2">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                  <span className="text-[11px] text-purple-200/50">Used {diskPercent}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#1e1b4b]" />
                  <span className="text-[11px] text-purple-200/50">Free</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function StatCard({ label, value, sub, color, icon }) {
  return (
    <div className="rounded-2xl bg-[#110e28] border border-purple-500/10 p-5 group hover:border-purple-500/25 transition-all">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-purple-200/50">{label}</span>
        <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg shadow-purple-500/10`}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d={icon} />
          </svg>
        </div>
      </div>
      <p className="text-2xl font-bold">{value}</p>
      {sub && <p className="text-[11px] text-purple-200/30 mt-1 font-mono">{sub}</p>}
    </div>
  );
}