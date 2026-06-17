"use client";

import { useState, useEffect, useMemo, createContext, useContext } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

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
      <div className="flex min-h-screen bg-[#0c0a1d] text-white">
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/60 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        <aside
          className={`fixed inset-y-0 left-0 z-50 bg-[#110e28] border-r border-purple-500/10 flex flex-col shrink-0 transform transition-all duration-200 md:relative md:translate-x-0 w-64 ${
            sidebarCollapsed ? "md:w-20" : "md:w-64"
          } ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}
        >
          <div className="p-4 border-b border-purple-500/10">
            <div
              className={`flex items-center ${
                sidebarCollapsed && !mobileMenuOpen
                  ? "justify-center"
                  : "justify-between gap-3"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center font-bold text-sm shadow-lg shadow-violet-500/30 shrink-0">
                  CG
                </div>

                {showSidebarText && (
                  <div className="min-w-0">
                    <h1 className="font-bold text-sm truncate">
                      Chad&apos;s Goon Cave
                    </h1>
                    <p className="text-[11px] text-purple-300/50 truncate">
                      Server Dashboard
                    </p>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => setSidebarCollapsed((prev) => !prev)}
                className="hidden md:flex w-8 h-8 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 text-purple-300 items-center justify-center transition-all shrink-0"
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
              <p className="text-[10px] font-semibold uppercase tracking-widest text-purple-400/40 px-3 mb-2">
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
                    ? "bg-violet-500/15 text-white font-medium shadow-sm shadow-violet-500/10"
                    : "text-purple-200/50 hover:text-white hover:bg-purple-500/10"
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

          <div className="p-3 border-t border-purple-500/10">
            {showSidebarText ? (
              <div className="rounded-xl bg-gradient-to-br from-violet-500/10 to-indigo-500/10 border border-purple-500/15 p-4">
                <p className="text-xs font-medium text-purple-200/70">
                  System Status
                </p>

                <div className="flex items-center gap-2 mt-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]" />
                  <span className="text-xs text-emerald-400">Online</span>
                </div>

                <div className="flex items-center gap-2 mt-2 text-[10px] text-purple-300/30 font-mono">
                  <Clock />
                </div>
              </div>
            ) : (
              <div
                title="System status · Online"
                className="hidden md:flex w-10 h-10 mx-auto rounded-xl bg-gradient-to-br from-violet-500/10 to-indigo-500/10 border border-purple-500/15 items-center justify-center"
              >
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              </div>
            )}
          </div>
        </aside>

        <main className="flex-1 overflow-auto">
          <button
            className="md:hidden fixed top-4 left-4 z-30 p-2 rounded-lg bg-[#110e28] border border-purple-500/10 text-purple-200/60"
            onClick={() => setMobileMenuOpen(true)}
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
          {children}
        </main>
      </div>
    </PageLayoutContext.Provider>
  );
}