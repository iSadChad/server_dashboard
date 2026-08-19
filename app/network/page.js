"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import PageLayout from "../../components/PageLayout";

const initialNetwork = {
  status: "loading",
  networkStatus: "unknown",
  updatedAt: null,
  tailscale: { BackendState: "Unknown", Self: null, Peer: {} },
};

function deviceName(device) {
  return device?.HostName || device?.DNSName?.replace(/\.$/, "") || "Unknown device";
}

function addresses(device) {
  return device?.TailscaleIPs || [];
}

function dateTime(value) {
  if (!value) return "Waiting for signal";
  return new Date(value).toLocaleString("en-GB", {
    day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit",
  });
}

function StatusDot({ online, pulse = false }) {
  return (
    <span className="relative flex h-2.5 w-2.5 shrink-0" aria-hidden="true">
      {online && pulse && <span className="absolute h-full w-full animate-ping rounded-full bg-emerald-300 opacity-40" />}
      <span className={`relative h-2.5 w-2.5 rounded-full ${online ? "bg-emerald-300 shadow-[0_0_12px_rgba(110,231,183,0.9)]" : "bg-rose-400 shadow-[0_0_10px_rgba(251,113,133,0.65)]"}`} />
    </span>
  );
}

function InfoCard({ label, value, detail, accent = "cyan", children }) {
  const styles = {
    cyan: "border-cyan-300/20 from-cyan-400/12 text-cyan-200",
    pink: "border-fuchsia-300/20 from-fuchsia-400/12 text-fuchsia-200",
    violet: "border-violet-300/20 from-violet-400/12 text-violet-200",
  };
  return (
    <div className={`relative overflow-hidden rounded-2xl border bg-linear-to-br ${styles[accent]} via-[#170a31]/80 to-[#0e071d]/85 p-5 shadow-[0_18px_55px_rgba(5,0,22,0.28)]`}>
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-current opacity-[0.04] blur-2xl" />
      <p className="font-mono text-[9px] font-bold uppercase tracking-[0.24em] opacity-60">{label}</p>
      <p className="mt-3 truncate text-2xl font-black tracking-tight text-white">{value}</p>
      {detail && <p className="mt-1 truncate text-xs text-violet-100/50">{detail}</p>}
      {children}
    </div>
  );
}

function PeerCard({ peer }) {
  const ips = addresses(peer);
  return (
    <article className="group rounded-2xl border border-violet-300/15 bg-[#120827]/70 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-cyan-300/30 hover:bg-cyan-300/[0.06]">
      <div className="flex items-start gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-violet-300/15 bg-violet-400/10 text-violet-100/70 group-hover:text-cyan-200">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" aria-hidden="true"><rect x="3" y="4" width="18" height="13" rx="2" /><path d="M8 21h8M12 17v4" /></svg>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <h4 className="truncate text-sm font-bold text-white">{deviceName(peer)}</h4>
            <StatusDot online={Boolean(peer.Online)} />
          </div>
          <p className="mt-1 truncate font-mono text-[10px] text-violet-200/45">{peer.OS || "unknown OS"} · {peer.Online ? "online" : "offline"}</p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {ips.length ? ips.map((ip) => <span key={ip} className="rounded-lg border border-cyan-300/15 bg-cyan-300/[0.06] px-2.5 py-1 font-mono text-[10px] text-cyan-100/70">{ip}</span>) : <span className="font-mono text-[10px] text-violet-100/35">No address reported</span>}
      </div>
    </article>
  );
}

function NetworkContent() {
  const [network, setNetwork] = useState(initialNetwork);
  const [loading, setLoading] = useState(true);

  const fetchNetwork = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/network", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || `Request failed (${response.status})`);
      setNetwork({ ...initialNetwork, ...data, tailscale: { ...initialNetwork.tailscale, ...data.tailscale } });
    } catch (error) {
      console.error("Failed to load network status:", error);
      setNetwork({ ...initialNetwork, status: "error", message: error.message || "Could not load network status" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNetwork();
    const interval = setInterval(fetchNetwork, 30000);
    return () => clearInterval(interval);
  }, [fetchNetwork]);

  const self = network.tailscale.Self;
  const peers = useMemo(() => Object.values(network.tailscale.Peer || {}), [network.tailscale.Peer]);
  const onlinePeers = peers.filter((peer) => peer.Online);
  const connected = network.networkStatus === "connected";
  const selfIps = addresses(self);

  return (
    <div className="vapor-page p-3 sm:p-4 lg:p-8">
      <header className="vapor-header page-command-header relative mb-6 overflow-hidden rounded-3xl border border-cyan-300/20 bg-linear-to-br from-cyan-400/15 via-violet-500/10 to-fuchsia-400/10 px-5 py-6 shadow-[0_0_55px_rgba(34,211,238,0.12)] md:mb-8 md:px-7 md:py-8">
        <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full border border-cyan-300/10" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="mb-2 font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-cyan-300/75">Mesh console // tailscale layer</p>
            <h2 className="text-3xl font-black tracking-tight text-white md:text-5xl">Network</h2>
            <p className="mt-2 text-sm text-violet-100/55">Private devices, tunnel health and mesh availability</p>
          </div>
          <div className="flex w-full items-center gap-3 sm:w-auto">
            <button type="button" onClick={fetchNetwork} disabled={loading} className="rounded-xl border border-cyan-300/25 bg-cyan-300/10 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-cyan-100 transition-all hover:-translate-y-0.5 hover:bg-fuchsia-300/10 disabled:cursor-wait disabled:opacity-55">{loading ? "Scanning" : "Refresh"}</button>
            <div className="flex min-w-0 flex-1 items-center gap-2 rounded-full border border-violet-300/20 bg-violet-300/[0.08] px-4 py-2.5 font-mono text-[10px] text-violet-100/60 sm:flex-none"><StatusDot online={connected} pulse /><span className="truncate">{loading ? "Reading mesh" : dateTime(network.updatedAt)}</span></div>
          </div>
        </div>
      </header>

      {network.status === "error" && <div className="mb-6 flex items-center gap-3 rounded-2xl border border-rose-400/25 bg-rose-400/10 px-4 py-3 text-sm text-rose-100"><StatusDot online={false} /><div><strong>Network data unavailable.</strong> <span className="text-rose-100/60">{network.message}</span></div></div>}

      <section className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <InfoCard label="Mesh state" value={loading ? "Scanning…" : network.tailscale.BackendState} detail={connected ? "Encrypted tunnel active" : "Tunnel unavailable"}><div className="mt-4 flex items-center gap-2 text-xs"><StatusDot online={connected} pulse /><span className={connected ? "text-emerald-300" : "text-rose-300"}>{network.networkStatus}</span></div></InfoCard>
        <InfoCard label="This device" value={deviceName(self)} detail={self?.OS || "Operating system unknown"} accent="pink" />
        <InfoCard label="Peers online" value={`${onlinePeers.length} / ${peers.length}`} detail="Reachable devices in your tailnet" accent="violet" />
        <InfoCard label="Tailnet address" value={selfIps[0] || "—"} detail={selfIps.length > 1 ? `${selfIps.length} assigned addresses` : "Primary Tailscale IP"} />
      </section>

      <section className="grid grid-cols-1 gap-4 xl:grid-cols-[0.7fr_1.3fr]">
        <div className="rounded-3xl border border-fuchsia-300/15 bg-linear-to-br from-fuchsia-400/[0.08] via-[#16092d]/85 to-[#0d061b]/90 p-5 shadow-[0_24px_70px_rgba(5,0,22,0.3)] md:p-6">
          <div className="flex items-center justify-between gap-3"><div><p className="font-mono text-[9px] uppercase tracking-[0.25em] text-fuchsia-200/50">Local endpoint</p><h3 className="mt-1 text-lg font-black text-white">Device identity</h3></div><span className="rounded-full border border-fuchsia-300/15 bg-fuchsia-300/[0.07] px-3 py-1 font-mono text-[9px] uppercase text-fuchsia-100/60">self</span></div>
          <dl className="mt-6 space-y-4">
            {[["Hostname", deviceName(self)], ["DNS name", self?.DNSName?.replace(/\.$/, "") || "—"], ["Operating system", self?.OS || "—"], ["Node ID", self?.ID || "—"]].map(([label, value]) => <div key={label} className="border-b border-violet-200/10 pb-4 last:border-0 last:pb-0"><dt className="font-mono text-[9px] uppercase tracking-[0.2em] text-violet-200/40">{label}</dt><dd className="mt-1 truncate font-mono text-xs text-violet-50/80" title={value}>{value}</dd></div>)}
          </dl>
        </div>

        <div className="rounded-3xl border border-cyan-300/15 bg-linear-to-br from-cyan-400/[0.07] via-[#13082a]/85 to-[#0d061b]/90 p-5 shadow-[0_24px_70px_rgba(5,0,22,0.3)] md:p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-mono text-[9px] uppercase tracking-[0.25em] text-cyan-200/50">Tailnet inventory</p><h3 className="mt-1 text-lg font-black text-white">Connected devices</h3></div><p className="font-mono text-[10px] text-violet-100/45">{onlinePeers.length} online · {peers.length - onlinePeers.length} offline</p></div>
          {peers.length ? <div className="mt-6 grid grid-cols-1 gap-3 lg:grid-cols-2">{[...peers].sort((a, b) => Number(Boolean(b.Online)) - Number(Boolean(a.Online))).map((peer, index) => <PeerCard key={peer.ID || peer.PublicKey || index} peer={peer} />)}</div> : <div className="mt-6 grid min-h-48 place-items-center rounded-2xl border border-dashed border-cyan-300/15 bg-cyan-300/[0.025] px-6 text-center"><div><p className="text-sm font-bold text-violet-100/70">No peers reported</p><p className="mt-1 text-xs text-violet-100/35">Devices in your tailnet will appear here.</p></div></div>}
        </div>
      </section>
    </div>
  );
}

export default function NetworkPage() {
  return <PageLayout><NetworkContent /></PageLayout>;
}
