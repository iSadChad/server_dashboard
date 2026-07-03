"use client";

import { useEffect, useState } from "react";
import PageLayout from "../../components/PageLayout";

const defaultAdmin = {
  status: "loading",
  updatedAt: null,
  system: {
    hostname: "—",
    kernel: "—",
    uptime: "—",
    rebootRequired: false,
  },
  security: {
    firewall: {
      status: "unknown",
      raw: "",
    },
    ssh: {
      active: "unknown",
      enabled: "unknown",
    },
    failedLoginsToday: 0,
    openPorts: [],
    lastLogins: [],
  },
  updates: {
    pending: 0,
    packages: [],
    rebootRequired: false,
  },
  services: [],
  storage: {
    folders: [],
  },
  logs: {
    ssh: [],
    systemErrors: [],
  },
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

function getStatusStyle(status) {
  const normalized = String(status || "").toLowerCase();

  if (["ok", "online", "active", "enabled"].includes(normalized)) {
    return {
      dot: "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]",
      text: "text-emerald-400",
      bg: "bg-emerald-500/10",
      border: "border-emerald-500/20",
    };
  }

  if (["warning", "inactive", "disabled", "unknown"].includes(normalized)) {
    return {
      dot: "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.7)]",
      text: "text-amber-400",
      bg: "bg-amber-500/10",
      border: "border-amber-500/20",
    };
  }

  return {
    dot: "bg-rose-400 shadow-[0_0_8px_rgba(251,113,133,0.7)]",
    text: "text-rose-400",
    bg: "bg-rose-500/10",
    border: "border-rose-500/20",
  };
}

export default function AdminPage() {
  return (
    <PageLayout>
      <AdminContent />
    </PageLayout>
  );
}

function AdminContent() {
  const [admin, setAdmin] = useState(defaultAdmin);
  const [loading, setLoading] = useState(true);

  async function fetchAdmin() {
    try {
      const response = await fetch("/api/admin", {
        cache: "no-store",
      });

      const data = await response.json();

      setAdmin({
        ...defaultAdmin,
        ...data,
      });
    } catch (error) {
      console.error("Failed to fetch admin data:", error);

      setAdmin({
        ...defaultAdmin,
        status: "error",
        message: "Could not load admin data",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAdmin();

    const interval = setInterval(fetchAdmin, 30000);

    return () => clearInterval(interval);
  }, []);

  const onlineServices = admin.services.filter(
    (service) => service.status === "online"
  ).length;

  const totalServices = admin.services.length;

  return (
    <div className="p-3 sm:p-4 lg:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 md:mb-8">
        <div>
          <h2 className="text-xl md:text-2xl font-bold">Admin</h2>
          <p className="text-red-200/40 text-sm mt-1">
            Server maintenance, security and service health
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={fetchAdmin}
            className="rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-300 px-3 py-2 text-xs font-medium transition-all"
          >
            Refresh
          </button>

          <div className="flex items-center gap-2 text-xs text-red-200/40 font-mono bg-[#111111] rounded-lg px-3 py-2 border border-red-500/10 w-full sm:w-auto">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="truncate">
              {loading ? "Loading..." : `Updated · ${formatDateTime(admin.updatedAt)}`}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
        <AdminStatCard
  label="Firewall"
  value={admin.security.firewall}
  sub="UFW status"
  status={admin.security.firewall}
/>

        <AdminStatCard
          label="SSH"
          value={admin.security.ssh.active}
          sub={`Enabled: ${admin.security.ssh.enabled}`}
          status={admin.security.ssh.active}
        />

        <AdminStatCard
          label="Updates"
          value={admin.updates.pending}
          sub={admin.updates.rebootRequired ? "Reboot required" : "No reboot needed"}
          status={admin.updates.pending > 0 ? "warning" : "ok"}
        />

        <AdminStatCard
          label="Services"
          value={`${onlineServices}/${totalServices || 0}`}
          sub="Online"
          status={
            totalServices > 0 && onlineServices === totalServices
              ? "ok"
              : "warning"
          }
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 md:gap-4 mb-6 md:mb-8">
        <Panel title="System" subtitle="Host and maintenance state">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <MiniInfo label="Hostname" value={admin.system.hostname} mono />
            <MiniInfo label="Kernel" value={admin.system.kernel} mono />
            <MiniInfo label="Uptime" value={admin.system.uptime} />
            <MiniInfo
              label="Reboot required"
              value={admin.system.rebootRequired ? "Yes" : "No"}
              status={admin.system.rebootRequired ? "warning" : "ok"}
            />
          </div>
        </Panel>

        <Panel title="Security" subtitle="Firewall, SSH and exposed ports">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <StatusBox label="Firewall" value={admin.security.firewall.status} />
            <StatusBox label="SSH service" value={admin.security.ssh.active} />
          </div>

          <div className="rounded-xl bg-[#111111] border border-red-500/10 p-4 mb-3">
            <p className="text-[10px] uppercase tracking-widest text-red-300/35 font-semibold mb-2">
              Failed logins today
            </p>

            <p
              className={`text-2xl font-bold ${
                admin.security.failedLoginsToday > 0
                  ? "text-amber-400"
                  : "text-red-100"
              }`}
            >
              {admin.security.failedLoginsToday}
            </p>
          </div>

          <div className="rounded-xl bg-[#111111] border border-red-500/10 p-4">
            <p className="text-[10px] uppercase tracking-widest text-red-300/35 font-semibold mb-2">
              Open ports
            </p>

            <div className="flex flex-wrap gap-2">
              {admin.security.openPorts.length > 0 ? (
                admin.security.openPorts.map((port) => (
                  <span
                    key={port}
                    className="rounded-full border border-red-500/20 bg-red-500/10 px-2.5 py-1 text-xs text-red-200 font-mono"
                  >
                    :{port}
                  </span>
                ))
              ) : (
                <span className="text-sm text-red-200/40">No ports found.</span>
              )}
            </div>
          </div>
        </Panel>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-3 md:gap-4 mb-6 md:mb-8">
        <Panel
          title="Service Health"
          subtitle="Checks if services actually respond"
          className="xl:col-span-2"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {admin.services.length > 0 ? (
              admin.services.map((service) => (
                <ServiceCard key={service.name} service={service} />
              ))
            ) : (
              <p className="text-sm text-red-200/40">
                No service checks loaded.
              </p>
            )}
          </div>
        </Panel>

        <Panel title="Updates" subtitle="APT package status">
          <div className="rounded-xl bg-[#111111] border border-red-500/10 p-4 mb-3">
            <p className="text-[10px] uppercase tracking-widest text-red-300/35 font-semibold mb-1">
              Pending updates
            </p>

            <p className="text-3xl font-bold text-red-100">
              {admin.updates.pending}
            </p>

            <p className="text-xs text-red-200/35 mt-1">
              {admin.updates.rebootRequired ? "Reboot required" : "No reboot required"}
            </p>
          </div>

          <details className="rounded-xl bg-[#111111] border border-red-500/10 overflow-hidden">
            <summary className="cursor-pointer px-4 py-3 text-xs font-semibold text-red-200/60 hover:text-red-100 transition-all">
              Show packages
            </summary>

            <div className="border-t border-red-500/10 px-4 py-3">
              {admin.updates.packages.length > 0 ? (
                <ul className="space-y-1">
                  {admin.updates.packages.map((pkg) => (
                    <li
                      key={pkg}
                      className="text-[11px] text-red-100/55 font-mono break-all"
                    >
                      {pkg}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-[11px] text-red-100/55 font-mono">
                  No pending packages.
                </p>
              )}
            </div>
          </details>
        </Panel>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3 md:gap-4">
        <Panel title="Storage Details" subtitle="Important folders">
          <div className="space-y-3">
            {admin.storage.folders.length > 0 ? (
              admin.storage.folders.map((folder) => (
                <div
                  key={folder.path}
                  className="rounded-xl bg-[#111111] border border-red-500/10 p-4 min-w-0"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-red-100">
                        {folder.label}
                      </p>

                      <p className="text-[11px] text-red-300/30 font-mono break-all mt-1">
                        {folder.path}
                      </p>
                    </div>

                    <span
                      className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-mono border ${
                        folder.exists
                          ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20"
                          : "text-amber-400 bg-amber-500/10 border-amber-500/20"
                      }`}
                    >
                      {folder.size}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-red-200/40">
                No storage folders loaded.
              </p>
            )}
          </div>
        </Panel>

        <Panel title="Logs" subtitle="Recent SSH and system errors">
          <details className="rounded-xl bg-[#111111] border border-red-500/10 overflow-hidden mb-3">
            <summary className="cursor-pointer px-4 py-3 text-xs font-semibold text-red-200/60 hover:text-red-100 transition-all">
              Last SSH log lines
            </summary>

            <pre className="max-h-64 overflow-auto border-t border-red-500/10 px-4 py-3 text-[11px] leading-relaxed text-red-100/55 font-mono whitespace-pre-wrap">
              {admin.logs.ssh.length > 0
                ? admin.logs.ssh.join("\n")
                : "No SSH log lines found."}
            </pre>
          </details>

          <details className="rounded-xl bg-[#111111] border border-red-500/10 overflow-hidden">
            <summary className="cursor-pointer px-4 py-3 text-xs font-semibold text-red-200/60 hover:text-red-100 transition-all">
              System errors
            </summary>

            <pre className="max-h-64 overflow-auto border-t border-red-500/10 px-4 py-3 text-[11px] leading-relaxed text-red-100/55 font-mono whitespace-pre-wrap">
              {admin.logs.systemErrors.length > 0
                ? admin.logs.systemErrors.join("\n")
                : "No system errors found."}
            </pre>
          </details>
        </Panel>
      </div>
    </div>
  );
}

function AdminStatCard({ label, value, sub, status }) {
  const style = getStatusStyle(status);

  return (
    <div
      className={`rounded-2xl bg-white/[0.03] backdrop-blur-sm border ${style.border} p-4 sm:p-5 min-w-0`}
    >
      <div className="flex items-center justify-between gap-3 mb-3">
        <span className="text-xs font-medium text-red-200/50 truncate">
          {label}
        </span>

        <span
          className={`inline-block w-2.5 h-2.5 rounded-full shrink-0 ${style.dot}`}
        />
      </div>

      <p className="text-xl sm:text-2xl font-bold break-words capitalize">
        {value}
      </p>

      {sub && (
        <p className="text-[11px] text-red-200/30 mt-1 font-mono break-words leading-relaxed">
          {sub}
        </p>
      )}
    </div>
  );
}

function Panel({ title, subtitle, children, className = "" }) {
  return (
    <div
      className={`rounded-2xl bg-white/[0.03] backdrop-blur-sm border border-red-500/10 p-4 md:p-6 min-w-0 ${className}`}
    >
      <h3 className="text-sm font-semibold text-red-200/70 mb-1">
        {title}
      </h3>

      {subtitle && (
        <p className="text-[11px] text-red-300/30 mb-4">{subtitle}</p>
      )}

      {children}
    </div>
  );
}

function MiniInfo({ label, value, mono = false, status = null }) {
  const style = status ? getStatusStyle(status) : null;

  return (
    <div
      className={`rounded-xl bg-[#111111] border ${
        style ? style.border : "border-red-500/10"
      } p-4 min-w-0`}
    >
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

function StatusBox({ label, value }) {
  const style = getStatusStyle(value);

  return (
    <div className={`rounded-xl ${style.bg} border ${style.border} p-4`}>
      <div className="flex items-center gap-2 mb-1">
        <span className={`inline-block w-2 h-2 rounded-full ${style.dot}`} />
        <p className={`text-xs font-mono ${style.text} capitalize`}>
          {value}
        </p>
      </div>

      <p className="text-[10px] uppercase tracking-widest text-red-300/35 font-semibold">
        {label}
      </p>
    </div>
  );
}

function ServiceCard({ service }) {
  const style = getStatusStyle(service.status);

  return (
    <div
      className={`rounded-xl bg-[#111111] border ${style.border} p-4 min-w-0`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-red-100 truncate">
            {service.name}
          </p>

          <p className="text-[11px] text-red-300/30 font-mono truncate">
            {service.target || `${service.host}:${service.port}` || "—"}
          </p>
        </div>

        <span
          className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-mono border ${style.bg} ${style.border} ${style.text}`}
        >
          {service.status}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <MiniMetric label="Type" value={service.type || "—"} />
        <MiniMetric
          label="Response"
          value={
            service.responseMs !== null && service.responseMs !== undefined
              ? `${service.responseMs}ms`
              : "—"
          }
        />
      </div>
    </div>
  );
}

function MiniMetric({ label, value }) {
  return (
    <div className="rounded-lg bg-black/20 border border-red-500/5 p-2 min-w-0">
      <p className="text-[10px] uppercase tracking-widest text-red-300/30 font-semibold mb-1">
        {label}
      </p>

      <p className="text-xs text-red-100 font-mono truncate">{value}</p>
    </div>
  );
}