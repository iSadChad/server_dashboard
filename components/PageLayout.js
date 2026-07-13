"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import StarBackground from "./StarBackground";

const PageLayoutContext = createContext();

export function usePageLayout() {
  return useContext(PageLayoutContext);
}

const navItems = [
  {
    label: "Dashboard",
    mobileLabel: "Home",
    href: "/",
    icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
  },
  {
    label: "Files",
    mobileLabel: "Files",
    href: "/files",
    icon: "M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z",
  },
  {
    label: "Databases",
    mobileLabel: "Data",
    href: "/databases",
    icon: "M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4",
  },
  {
    label: "Tasks",
    mobileLabel: "Tasks",
    href: "/tasks",
    icon: "M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11",
  },
  {
    label: "Tools",
    mobileLabel: "Tools",
    href: "/tools",
    icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z",
  },
  {
    label: "Admin",
    mobileLabel: "Admin",
    href: "/admin",
    icon: "M12 15c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z",
  },
];

function Clock() {
  const [time, setTime] = useState("");

  useEffect(() => {
    function update() {
      const now = new Date();
      setTime(
        now.toLocaleDateString("en-US", {
          weekday: "short",
          month: "short",
          day: "numeric",
        }) +
          " // " +
          now.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })
      );
    }

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  return <>{time}</>;
}

function NavIcon({ path }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="shrink-0"
    >
      <path d={path} />
    </svg>
  );
}

export default function PageLayout({ children }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const showSidebarText = !sidebarCollapsed || mobileMenuOpen;
  const activeItem = navItems.find((item) => item.href === pathname) ?? navItems[0];

  const contextValue = useMemo(
    () => ({ mobileMenuOpen, setMobileMenuOpen, sidebarCollapsed }),
    [mobileMenuOpen, sidebarCollapsed]
  );

  return (
    <PageLayoutContext.Provider value={contextValue}>
      <StarBackground />

      <div className="vapor-root cyber-root relative flex min-h-screen text-white" style={{ zIndex: 1 }}>
        <div className="vapor-overlay pointer-events-none fixed inset-0" aria-hidden="true">
          <div className="vapor-orb vapor-orb-pink absolute -top-28 right-[8%] h-72 w-72 rounded-full bg-fuchsia-500/10 blur-3xl" />
          <div className="vapor-orb vapor-orb-cyan absolute bottom-[8%] left-[12%] h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />
          <div className="vapor-scanlines absolute inset-0 opacity-30" />
        </div>

        {mobileMenuOpen && (
          <button
            type="button"
            className="fixed inset-0 z-40 cursor-default bg-[#070313]/80 backdrop-blur-sm md:hidden"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close navigation menu"
          />
        )}

        <aside
          id="primary-navigation"
          className={`vapor-sidebar fixed inset-y-0 left-0 z-50 flex w-[min(88vw,19rem)] shrink-0 transform flex-col overflow-hidden border-r border-fuchsia-300/25 bg-[#100822]/95 shadow-[16px_0_70px_rgba(9,2,24,0.75)] backdrop-blur-2xl transition-[width,transform] duration-500 md:inset-y-4 md:left-4 md:rounded-[1.75rem] md:border md:border-fuchsia-300/25 ${
            sidebarCollapsed ? "md:w-20" : "md:w-64"
          } ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
        >
          <div className="vapor-sidebar-glow pointer-events-none absolute inset-x-0 top-0 h-40 bg-linear-to-b from-fuchsia-500/15 to-transparent" aria-hidden="true" />
          <div className="pointer-events-none absolute top-0 right-0 h-24 w-24 bg-cyan-300/10 blur-3xl" aria-hidden="true" />

          <header className="relative border-b border-fuchsia-200/15 px-4 pt-5 pb-4">
            <div className={`flex items-center ${showSidebarText ? "gap-3" : "justify-center"}`}>
              <button
                type="button"
                className="vapor-brand-mark group relative grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-cyan-200/50 bg-linear-to-br from-cyan-300 via-violet-500 to-fuchsia-500 font-mono text-xs font-black tracking-[-0.08em] text-[#120421] shadow-[0_0_22px_rgba(34,211,238,0.35),0_0_38px_rgba(217,70,239,0.2)] transition-transform hover:scale-105"
                onClick={() => sidebarCollapsed && setSidebarCollapsed(false)}
                aria-label={sidebarCollapsed ? "Expand navigation" : "Chad's Goon Cave"}
              >
                C/G
                <span className="absolute -right-1 -bottom-1 h-2.5 w-2.5 rounded-full border-2 border-[#100822] bg-lime-300 shadow-[0_0_10px_rgba(190,242,100,0.9)]" />
              </button>

              {showSidebarText && (
                <div className="min-w-0 flex-1">
                  <h1 className="truncate text-sm font-black tracking-[0.06em] text-white">
                    CHAD&apos;S <span className="text-fuchsia-300">/</span> GOON CAVE
                  </h1>
                </div>
              )}

              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-fuchsia-300/25 bg-fuchsia-300/10 text-fuchsia-100 transition-colors hover:bg-fuchsia-300/20 md:hidden"
                aria-label="Close menu"
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setSidebarCollapsed((previous) => !previous)}
              className="vapor-collapse absolute top-1/2 -right-3 hidden h-7 w-7 -translate-y-1/2 place-items-center rounded-full border border-cyan-200/40 bg-[#160a2b] text-cyan-200 shadow-[0_0_16px_rgba(34,211,238,0.25)] transition-transform hover:scale-110 md:grid"
              title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className={`transition-transform duration-500 ${sidebarCollapsed ? "rotate-180" : ""}`}
              >
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
          </header>

          <nav className="vapor-nav relative flex-1 space-y-2 overflow-y-auto px-3 py-5" aria-label="Main navigation">
            {showSidebarText && (
              <div className="mb-3 flex items-center gap-2 px-3">
                <span className="font-mono text-[9px] font-semibold tracking-[0.25em] text-fuchsia-200/55">SYS.NAV</span>
                <span className="h-px flex-1 bg-linear-to-r from-fuchsia-300/30 to-transparent" />
                <span className="font-mono text-[9px] text-cyan-200/45">06</span>
              </div>
            )}

            {navItems.map((item, index) => {
              const isActive = item.href === pathname;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={item.label}
                  aria-current={isActive ? "page" : undefined}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`vapor-nav-item group flex min-h-12 items-center rounded-xl border text-sm transition-all duration-300 ${
                    showSidebarText ? "gap-3 px-3" : "justify-center px-2"
                  } ${
                    isActive
                      ? "is-active border-fuchsia-300/40 bg-linear-to-r from-fuchsia-500/25 via-violet-500/15 to-cyan-400/10 font-semibold text-white shadow-[0_0_24px_rgba(217,70,239,0.14),inset_0_0_18px_rgba(34,211,238,0.05)]"
                      : "border-transparent text-violet-100/65 hover:border-cyan-300/20 hover:bg-cyan-300/5 hover:text-cyan-50"
                  }`}
                >
                  <span
                    className={`vapor-nav-icon grid h-8 w-8 shrink-0 place-items-center rounded-lg transition-all duration-300 ${
                      isActive
                        ? "bg-linear-to-br from-fuchsia-400/30 to-cyan-300/20 text-cyan-200 shadow-[0_0_16px_rgba(34,211,238,0.15)]"
                        : "bg-violet-300/5 text-violet-200/55 group-hover:bg-cyan-300/10 group-hover:text-cyan-200"
                    }`}
                  >
                    <NavIcon path={item.icon} />
                  </span>

                  {showSidebarText && (
                    <>
                      <span className="flex-1 tracking-wide">{item.label}</span>
                      <span className={`font-mono text-[9px] ${isActive ? "text-fuchsia-200/80" : "text-violet-200/25 group-hover:text-cyan-200/50"}`}>
                        0{index + 1}
                      </span>
                    </>
                  )}
                </Link>
              );
            })}
          </nav>

          <footer className="relative border-t border-fuchsia-200/15 p-3">
            {showSidebarText ? (
              <div className="vapor-status relative overflow-hidden rounded-[1.35rem] border border-violet-300/20 bg-linear-to-br from-violet-500/10 via-[#160b2a]/90 to-cyan-400/5 p-4 shadow-[inset_0_1px_rgba(255,255,255,0.06)]">
                <div className="absolute -right-6 -bottom-8 h-20 w-20 rounded-full bg-fuchsia-400/10 blur-2xl" aria-hidden="true" />
                <div className="relative flex items-center justify-between gap-3">
                  <div>
                    <p className="font-mono text-[9px] tracking-[0.24em] text-violet-200/50">SYSTEM SIGNAL</p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-lime-300 opacity-50" />
                        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-lime-300 shadow-[0_0_10px_rgba(190,242,100,0.9)]" />
                      </span>
                      <span className="text-xs font-bold tracking-[0.12em] text-lime-200">ONLINE</span>
                    </div>
                  </div>
                  <div className="flex h-8 items-end gap-1" aria-hidden="true">
                    {[45, 70, 55, 90, 65].map((height, index) => (
                      <span
                        key={index}
                        className="w-1 rounded-full bg-linear-to-t from-fuchsia-500 to-cyan-300 shadow-[0_0_5px_rgba(34,211,238,0.45)]"
                        style={{ height: `${height}%` }}
                      />
                    ))}
                  </div>
                </div>
                <p className="relative mt-3 border-t border-violet-200/10 pt-2 font-mono text-[9px] tracking-wide text-cyan-100/45">
                  <Clock />
                </p>
              </div>
            ) : (
              <div
                title="System status · Online"
                className="vapor-status mx-auto hidden h-11 w-11 place-items-center rounded-xl border border-lime-200/20 bg-lime-300/5 md:grid"
              >
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-lime-300 opacity-50" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-lime-300 shadow-[0_0_11px_rgba(190,242,100,0.9)]" />
                </span>
              </div>
            )}
          </footer>
        </aside>

        <main
          className={`vapor-main cyber-main relative z-10 min-w-0 flex-1 overflow-auto transition-[padding] duration-500 ${
            sidebarCollapsed ? "md:pl-24" : "md:pl-72"
          }`}
        >
          <header className="vapor-mobile-header mobile-app-bar sticky top-0 z-30 flex min-h-15 items-center gap-3 border-b border-fuchsia-300/20 bg-[#0d061c]/90 px-3 py-2 shadow-[0_12px_35px_rgba(8,2,24,0.4)] backdrop-blur-xl md:hidden">
            <Link
              href="/"
              className="mobile-brand-mark relative grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-cyan-200/45 bg-linear-to-br from-cyan-300 via-violet-500 to-fuchsia-500 font-mono text-[10px] font-black tracking-[-0.08em] text-[#120421] shadow-[0_0_20px_rgba(34,211,238,0.28)]"
              aria-label="Go to dashboard"
              onClick={() => setMobileMenuOpen(false)}
            >
              C/G
              <span className="absolute -right-0.5 -bottom-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#0d061c] bg-lime-300 shadow-[0_0_8px_rgba(190,242,100,0.85)]" />
            </Link>

            <div className="min-w-0 flex-1">
              <p className="truncate font-mono text-[8px] tracking-[0.24em] text-fuchsia-300/60">
                CHAD&apos;S / GOON CAVE
              </p>
              <div className="mt-0.5 flex min-w-0 items-center gap-2">
                <span className="h-px w-4 shrink-0 bg-linear-to-r from-fuchsia-400 to-cyan-300" />
                <p className="truncate text-xs font-black tracking-[0.12em] text-white">
                  {activeItem.label.toUpperCase()}
                </p>
              </div>
            </div>

            <button
              type="button"
              className="mobile-menu-trigger grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-cyan-300/30 bg-cyan-300/10 text-cyan-100 shadow-[0_0_18px_rgba(34,211,238,0.12)] transition-colors hover:bg-cyan-300/20"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open menu"
              aria-expanded={mobileMenuOpen}
              aria-controls="primary-navigation"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M4 7h16M4 12h11M4 17h16" />
              </svg>
            </button>
          </header>

          {children}
        </main>

        <nav
          className="mobile-bottom-nav fixed inset-x-2 bottom-2 z-30 grid grid-cols-6 items-stretch overflow-hidden rounded-2xl border border-fuchsia-200/20 bg-[#100722]/92 p-1.5 shadow-[0_18px_55px_rgba(3,0,18,0.7),0_0_30px_rgba(217,70,239,0.12)] backdrop-blur-2xl md:hidden"
          aria-label="Mobile navigation"
        >
          {navItems.map((item) => {
            const isActive = item.href === pathname;

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                aria-label={item.label}
                onClick={() => setMobileMenuOpen(false)}
                className={`mobile-bottom-nav-item group relative flex min-h-12 min-w-11 flex-col items-center justify-center gap-0.5 rounded-xl border px-1 text-center transition-all duration-300 ${
                  isActive
                    ? "is-active border-fuchsia-300/35 bg-linear-to-br from-fuchsia-500/30 via-violet-500/20 to-cyan-400/15 text-white shadow-[0_0_20px_rgba(217,70,239,0.16)]"
                    : "border-transparent text-violet-100/50 hover:border-cyan-300/20 hover:bg-cyan-300/8 hover:text-cyan-100"
                }`}
              >
                <span
                  className={`grid h-6 w-6 place-items-center transition-all ${
                    isActive
                      ? "text-cyan-200 drop-shadow-[0_0_6px_rgba(103,232,249,0.65)]"
                      : "text-violet-100/55 group-hover:text-cyan-200"
                  }`}
                >
                  <NavIcon path={item.icon} />
                </span>
                <span className="max-w-full truncate font-mono text-[8px] font-bold leading-none tracking-tight">
                  {item.mobileLabel}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>
    </PageLayoutContext.Provider>
  );
}
