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
  firewall: "unknown",
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
    const initialFetch = setTimeout(fetchAdmin, 0);
    const interval = setInterval(fetchAdmin, 30000);

    return () => {
      clearTimeout(initialFetch);
      clearInterval(interval);
    };
  }, []);

  const onlineServices = admin.services.filter(
    (service) => service.status === "online"
  ).length;

  const totalServices = admin.services.length;

  return (
    <div className="vapor-page admin-workbench p-3 sm:p-4 lg:p-8">
      <div className="vapor-header page-command-header relative mb-6 flex flex-col gap-4 overflow-hidden rounded-3xl border border-fuchsia-300/20 bg-linear-to-br from-fuchsia-500/15 via-violet-500/10 to-cyan-400/10 px-5 py-6 shadow-[0_0_55px_rgba(217,70,239,0.14)] sm:flex-row sm:items-end sm:justify-between md:mb-8 md:px-7 md:py-8">
        <div>
          <p className="vapor-kicker mb-2 font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-cyan-300/75">
            Root console // system layer
          </p>
          <h2 className="vapor-title text-3xl font-black tracking-tight text-white md:text-5xl">Admin</h2>
          <p className="vapor-muted mt-2 text-sm text-violet-100/55">
            Server maintenance, security and service health
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={fetchAdmin}
            className="vapor-button rounded-xl border border-fuchsia-300/25 bg-fuchsia-400/10 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-fuchsia-100 transition-all duration-300 hover:-translate-y-0.5 hover:border-cyan-200/45 hover:bg-cyan-300/10"
          >
            Refresh
          </button>

          <div className="vapor-chip flex w-full items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2.5 font-mono text-xs text-cyan-100/65 sm:w-auto">
            <div className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(103,232,249,0.85)]" />
            <span className="truncate">
              {loading ? "Loading..." : `Updated · ${formatDateTime(admin.updatedAt)}`}
            </span>
          </div>
        </div>
      </div>

      <div className="admin-status-strip mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 md:mb-8 md:gap-4 xl:grid-cols-4">
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

      <div className="admin-system-grid mb-6 grid grid-cols-1 gap-4 md:mb-8 xl:grid-cols-[0.8fr_1.2fr]">
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
            <StatusBox label="Firewall" value={admin.security.firewall} />
            <StatusBox label="SSH service" value={admin.security.ssh.active} />
          </div>

          <div className="vapor-subpanel mb-3 rounded-2xl border border-fuchsia-300/15 bg-violet-950/55 p-4">
            <p className="vapor-kicker mb-2 text-[10px] font-bold uppercase tracking-[0.22em] text-cyan-200/45">
              Failed logins today
            </p>

            <p
              className={`text-2xl font-bold ${
                admin.security.failedLoginsToday > 0
                  ? "text-amber-400"
                  : "text-fuchsia-50"
              }`}
            >
              {admin.security.failedLoginsToday}
            </p>
          </div>

          <div className="vapor-subpanel rounded-2xl border border-cyan-300/15 bg-violet-950/55 p-4">
            <p className="vapor-kicker mb-2 text-[10px] font-bold uppercase tracking-[0.22em] text-cyan-200/45">
              Open ports
            </p>

            <div className="flex flex-wrap gap-2">
              {admin.security.openPorts.length > 0 ? (
                admin.security.openPorts.map((port) => (
                  <span
                    key={port}
                    className="vapor-chip rounded-full border border-fuchsia-300/20 bg-fuchsia-400/10 px-2.5 py-1 font-mono text-xs text-fuchsia-100/70"
                  >
                    :{port}
                  </span>
                ))
              ) : (
                <span className="text-sm text-violet-100/40">No ports found.</span>
              )}
            </div>
          </div>
        </Panel>
      </div>

      <div className="admin-service-grid mb-6 grid grid-cols-1 gap-4 md:mb-8 xl:grid-cols-3">
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
              <p className="text-sm text-violet-100/40">
                No service checks loaded.
              </p>
            )}
          </div>
        </Panel>

        <Panel title="Updates" subtitle="APT package status">
          <div className="vapor-subpanel mb-3 rounded-2xl border border-fuchsia-300/15 bg-violet-950/55 p-4">
            <p className="vapor-kicker mb-1 text-[10px] font-bold uppercase tracking-[0.22em] text-cyan-200/45">
              Pending updates
            </p>

            <p className="text-4xl font-black text-fuchsia-50">
              {admin.updates.pending}
            </p>

            <p className="vapor-muted mt-1 text-xs text-violet-100/40">
              {admin.updates.rebootRequired ? "Reboot required" : "No reboot required"}
            </p>
          </div>

          <details className="vapor-details overflow-hidden rounded-2xl border border-cyan-300/15 bg-violet-950/55">
            <summary className="cursor-pointer px-4 py-3 text-xs font-bold text-cyan-100/65 transition-all hover:text-fuchsia-100">
              Show packages
            </summary>

            <div className="border-t border-cyan-200/10 px-4 py-3">
              {admin.updates.packages.length > 0 ? (
                <ul className="space-y-1">
                  {admin.updates.packages.map((pkg) => (
                    <li
                      key={pkg}
                      className="break-all font-mono text-[11px] text-violet-50/55"
                    >
                      {pkg}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="font-mono text-[11px] text-violet-50/55">
                  No pending packages.
                </p>
              )}
            </div>
          </details>
        </Panel>
      </div>

      <div className="admin-log-grid grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Panel title="Storage Details" subtitle="Important folders">
          <div className="space-y-3">
            {admin.storage.folders.length > 0 ? (
              admin.storage.folders.map((folder) => (
                <div
                  key={folder.path}
                  className="vapor-list-row min-w-0 rounded-2xl border border-fuchsia-300/15 bg-violet-950/55 p-4 transition-all hover:border-cyan-200/30 hover:bg-cyan-300/5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-fuchsia-50">
                        {folder.label}
                      </p>

                      <p className="mt-1 break-all font-mono text-[11px] text-cyan-100/35">
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
              <p className="text-sm text-violet-100/40">
                No storage folders loaded.
              </p>
            )}
          </div>
        </Panel>

        <Panel title="Logs" subtitle="Recent SSH and system errors">
          <details className="vapor-details mb-3 overflow-hidden rounded-2xl border border-fuchsia-300/15 bg-violet-950/55">
            <summary className="cursor-pointer px-4 py-3 text-xs font-bold text-fuchsia-100/65 transition-all hover:text-cyan-100">
              Last SSH log lines
            </summary>

            <pre className="max-h-64 overflow-auto whitespace-pre-wrap border-t border-fuchsia-200/10 px-4 py-3 font-mono text-[11px] leading-relaxed text-violet-50/55">
              {admin.logs.ssh.length > 0
                ? admin.logs.ssh.join("\n")
                : "No SSH log lines found."}
            </pre>
          </details>

          <details className="vapor-details overflow-hidden rounded-2xl border border-cyan-300/15 bg-violet-950/55">
            <summary className="cursor-pointer px-4 py-3 text-xs font-bold text-cyan-100/65 transition-all hover:text-fuchsia-100">
              System errors
            </summary>

            <pre className="max-h-64 overflow-auto whitespace-pre-wrap border-t border-cyan-200/10 px-4 py-3 font-mono text-[11px] leading-relaxed text-violet-50/55">
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
      className={`vapor-card min-w-0 rounded-3xl border bg-linear-to-br from-fuchsia-500/10 to-cyan-400/5 p-4 shadow-[0_18px_45px_rgba(30,0,70,0.2)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-cyan-200/35 sm:p-5 ${style.border}`}
    >
      <div className="flex items-center justify-between gap-3 mb-3">
        <span className="vapor-kicker truncate font-mono text-[10px] font-bold uppercase tracking-[0.22em] text-cyan-200/55">
          {label}
        </span>

        <span
          className={`inline-block w-2.5 h-2.5 rounded-full shrink-0 ${style.dot}`}
        />
      </div>

      <p className="wrap-break-word text-2xl font-black capitalize text-fuchsia-50 sm:text-3xl">
          {value || "unknown"}
      </p>

      {sub && (
        <p className="vapor-muted mt-1 wrap-break-word font-mono text-[11px] leading-relaxed text-violet-100/40">
          {sub}
        </p>
      )}
    </div>
  );
}

function Panel({ title, subtitle, children, className = "" }) {
  return (
    <div
      className={`vapor-panel min-w-0 rounded-3xl border border-fuchsia-300/18 bg-violet-950/30 p-5 shadow-[0_22px_65px_rgba(30,0,65,0.22)] backdrop-blur-xl md:p-6 ${className}`}
    >
      <h3 className="mb-1 text-sm font-bold uppercase tracking-wider text-fuchsia-100">
        {title}
      </h3>

      {subtitle && (
        <p className="vapor-muted mb-4 text-[11px] text-violet-100/40">{subtitle}</p>
      )}

      {children}
    </div>
  );
}

function MiniInfo({ label, value, mono = false, status = null }) {
  const style = status ? getStatusStyle(status) : null;

  return (
    <div
      className={`vapor-subpanel min-w-0 rounded-2xl border bg-violet-950/55 p-4 ${
        style ? style.border : "border-fuchsia-300/15"
      }`}
    >
      <p className="vapor-kicker mb-1 text-[10px] font-bold uppercase tracking-[0.22em] text-cyan-200/45">
        {label}
      </p>

      <p
        className={`truncate text-sm font-bold text-fuchsia-50 ${
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
    <div className={`vapor-subpanel rounded-2xl border p-4 ${style.bg} ${style.border}`}>
      <div className="flex items-center gap-2 mb-1">
        <span className={`inline-block w-2 h-2 rounded-full ${style.dot}`} />
        <p className={`text-xs font-mono ${style.text} capitalize`}>
          {value}
        </p>
      </div>

      <p className="vapor-kicker text-[10px] font-bold uppercase tracking-[0.22em] text-cyan-200/45">
        {label}
      </p>
    </div>
  );
}

function ServiceCard({ service }) {
  const style = getStatusStyle(service.status);

  return (
    <div
      className={`vapor-list-row min-w-0 rounded-2xl border bg-violet-950/55 p-4 transition-all hover:-translate-y-0.5 hover:bg-fuchsia-400/6 ${style.border}`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-fuchsia-50">
            {service.name}
          </p>

          <p className="truncate font-mono text-[11px] text-cyan-100/35">
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
    <div className="min-w-0 rounded-xl border border-cyan-300/8 bg-violet-950/45 p-2.5">
      <p className="vapor-kicker mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-200/40">
        {label}
      </p>

      <p className="truncate font-mono text-xs text-fuchsia-50">{value}</p>
    </div>
  );
}
