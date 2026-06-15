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

export default function Home() {
  const [stats, setStats] = useState({
    cpu: 0,
    memory: { used: 0, total: 0 },
    disk: { used: 0, total: 0 },
    uptime: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/stats");
        const data = await res.json();
        setStats(data);
      } catch {
        setStats({
          cpu: 0,
          memory: { used: 0, total: 0 },
          disk: { used: 0, total: 0 },
          uptime: 0,
        });
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
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

  function getUsageColor(val) {
    if (val >= 90) return "#ef4444";
    if (val >= 70) return "#f59e0b";
    return "#3b82f6";
  }

  return (
    <main className="min-h-screen bg-[#0a0a0f] text-white flex flex-col">
      <nav className="border-b border-white/[0.06] px-6 lg:px-10 py-4 flex items-center justify-between bg-white/[0.02]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-violet-600 flex items-center justify-center font-bold text-xs tracking-wide">
            TC
          </div>
          <span className="font-semibold text-sm">Chad's Goon Cave</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden sm:block text-xs text-neutral-500 font-mono">
            Live · {loading ? "connecting" : `${stats.cpu.toFixed(0)}% CPU`}
          </span>
          <Link
            href="/files"
            className="rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium px-4 py-2 transition-colors"
          >
            Files
          </Link>
        </div>
      </nav>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-16">
        <div className="w-full max-w-lg text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-3 bg-gradient-to-b from-white to-neutral-400 bg-clip-text text-transparent">
            Server Dashboard
          </h1>
          <p className="text-neutral-500 text-base">
            Real-time system metrics at a glance
          </p>
        </div>

        <div className="w-full max-w-md space-y-6">
          <Ring
            label="CPU"
            value={loading ? null : stats.cpu}
            size={180}
            strokeWidth={10}
            color={getUsageColor(stats.cpu)}
          />

          <div className="grid grid-cols-2 gap-6">
            <Ring
              label="Memory"
              value={loading ? null : memPercentNum}
              detail={
                loading
                  ? "—"
                  : `${formatBytes(stats.memory.used)} / ${formatBytes(stats.memory.total)}`
              }
              size={140}
              strokeWidth={8}
              color={getUsageColor(memPercentNum)}
            />
            <Ring
              label="Disk"
              value={loading ? null : diskPercentNum}
              detail={
                loading
                  ? "—"
                  : `${formatBytes(stats.disk.used)} / ${formatBytes(stats.disk.total)}`
              }
              size={140}
              strokeWidth={8}
              color={getUsageColor(diskPercentNum)}
            />
          </div>

          <div className="flex items-center justify-between rounded-xl bg-white/[0.03] border border-white/[0.06] px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-sm text-neutral-400">Uptime</span>
            </div>
            <span className="text-sm font-mono font-medium">
              {loading ? "—" : `${uptimeHours}h ${uptimeMinutes}m`}
            </span>
          </div>

          <Link
            href="/files"
            className="block w-full text-center rounded-xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] hover:border-white/[0.14] text-white text-sm font-medium px-4 py-3.5 transition-all"
          >
            Browse Files →
          </Link>
        </div>
      </div>
    </main>
  );
}

function Ring({ label, value, detail, size, strokeWidth, color }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = value !== null ? (value / 100) * circumference : 0;
  const center = size / 2;

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} className="mb-3">
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={strokeWidth}
        />
        {value !== null && (
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
            transform={`rotate(-90 ${center} ${center})`}
            style={{
              transition: "stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          />
        )}
        <text
          x={center}
          y={detail ? center - 4 : center + 1}
          textAnchor="middle"
          dominantBaseline="central"
          fill="white"
          fontSize={size >= 160 ? "1.75rem" : "1.25rem"}
          fontWeight="700"
          fontFamily="inherit"
        >
          {value !== null ? `${value.toFixed(0)}%` : "—"}
        </text>
        {detail && (
          <text
            x={center}
            y={center + 20}
            textAnchor="middle"
            dominantBaseline="central"
            fill="rgb(163,163,163)"
            fontSize="0.65rem"
            fontWeight="400"
            fontFamily="inherit"
          >
            {detail}
          </text>
        )}
      </svg>
      <span className="text-xs font-medium uppercase tracking-widest text-neutral-500">
        {label}
      </span>
    </div>
  );
}