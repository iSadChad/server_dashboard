"use client";

import { useState, useEffect, useMemo, createContext, useContext } from "react";
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
    href: "/",
    icon: "M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6",
  },
  {
    label: "Files",
    href: "/files",
    icon: "M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z",
  },
  {
    label: "Databases",
    href: "/databases",
    icon: "M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4",
  },
  {
  label: "SnapOtter",
  href: "/snapotter",
  icon: "M4 7h16M4 12h16M4 17h16",
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
          " · " +
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

export default function PageLayout({ children }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const showSidebarText = !sidebarCollapsed || mobileMenuOpen;

  const contextValue = useMemo(
    () => ({ mobileMenuOpen, setMobileMenuOpen, sidebarCollapsed }),
    [mobileMenuOpen, sidebarCollapsed]
  );

  return (
    <PageLayoutContext.Provider value={contextValue}>
      <StarBackground />
      <div className="flex min-h-screen text-white relative" style={{ zIndex: 1 }}>
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/60 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        <aside
          className={`fixed inset-y-0 left-0 z-50 bg-[#111111]/90 backdrop-blur-sm border-r border-red-500/10 flex flex-col shrink-0 transform transition-all duration-200 md:relative md:translate-x-0 w-64 ${
            sidebarCollapsed ? "md:w-20" : "md:w-64"
          } ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}
        >
          <div className="p-4 border-b border-red-500/10">
            <div
              className={`flex items-center ${
                sidebarCollapsed && !mobileMenuOpen
                  ? "justify-center"
                  : "justify-between gap-3"
              }`}
            >
              <div
                className={`flex items-center gap-3 min-w-0 ${
                  sidebarCollapsed && !mobileMenuOpen ? "cursor-pointer" : ""
                }`}
                onClick={
                  sidebarCollapsed && !mobileMenuOpen
                    ? () => setSidebarCollapsed(false)
                    : undefined
                }
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center font-bold text-sm shadow-lg shadow-red-500/30 shrink-0">
                  CG
                </div>

                {showSidebarText && (
                  <div className="min-w-0">
                    <h1 className="font-bold text-sm truncate">
                      Chad&apos;s Goon Cave
                    </h1>
                    <p className="text-[11px] text-red-300/50 truncate">
                      Server Dashboard
                    </p>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => setSidebarCollapsed((prev) => !prev)}
                className={`w-8 h-8 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-300 items-center justify-center transition-all shrink-0 ${
                  sidebarCollapsed ? "hidden" : "hidden md:flex"
                }`}
                title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`transition-transform ${
                    sidebarCollapsed ? "rotate-180" : ""
                  }`}
                >
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>
            </div>
          </div>

          <nav className="flex-1 p-3 space-y-1">
            {showSidebarText && (
              <p className="text-[10px] font-semibold uppercase tracking-widest text-red-400/40 px-3 mb-2">
                Menu
              </p>
            )}

            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                title={item.label}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center ${
                  sidebarCollapsed && !mobileMenuOpen
                    ? "justify-center px-2"
                    : "gap-3 px-3"
                } py-2.5 rounded-lg text-sm transition-all ${
                  item.href === pathname
                    ? "bg-red-500/15 text-white font-medium shadow-sm shadow-red-500/10"
                    : "text-red-200/50 hover:text-white hover:bg-red-500/10"
                }`}
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="shrink-0"
                >
                  <path d={item.icon} />
                </svg>

                {showSidebarText && item.label}
              </Link>
            ))}
          </nav>

          <div className="p-3 border-t border-red-500/10">
            {showSidebarText ? (
                <div className="rounded-xl bg-gradient-to-br from-red-500/10 to-rose-500/10 border border-red-500/15 p-4 backdrop-blur-sm">
                <p className="text-xs font-medium text-red-200/70">
                  System Status
                </p>

                <div className="flex items-center gap-2 mt-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]" />
                  <span className="text-xs text-emerald-400">Online</span>
                </div>

                <div className="flex items-center gap-2 mt-2 text-[10px] text-red-300/30 font-mono">
                  <Clock />
                </div>
              </div>
            ) : (
              <div
                title="System status · Online"
                className="hidden md:flex w-10 h-10 mx-auto rounded-xl bg-gradient-to-br from-red-500/10 to-rose-500/10 border border-red-500/15 items-center justify-center"
              >
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              </div>
            )}
          </div>
        </aside>

       <main className="flex-1 overflow-auto min-w-0">
  <div className="md:hidden sticky top-0 z-30 bg-[#050505]/90 backdrop-blur-sm border-b border-red-500/10 px-3 py-3">
    <button
      type="button"
      className="inline-flex items-center justify-center p-2 rounded-lg bg-[#111111]/80 border border-red-500/10 text-red-200/70"
      onClick={() => setMobileMenuOpen(true)}
      aria-label="Open menu"
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    </button>
  </div>

  {children}
</main>
      </div>
    </PageLayoutContext.Provider>
  );
}