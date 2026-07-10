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
  { label: "Tasks", href: "/tasks", icon: "M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" },
  {
  label: "Tools",
  href: "/tools",
  icon: "M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z",
},
{ label: "Admin", 
  href: "/admin",
  icon: "M12 15c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z",},

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
      <div
        className="cyber-root flex min-h-screen text-white relative"
        style={{ zIndex: 1 }}
      >
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
        )}

        <aside
          className={`cyber-sidebar fixed inset-y-0 left-0 z-50 flex flex-col shrink-0 transform transition-all duration-300 md:relative md:translate-x-0 w-64 ${
            sidebarCollapsed ? "md:w-20" : "md:w-64"
          } ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}
        >
          <div className="p-4 border-b border-cyan-300/10">
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
                <div className="brand-mark w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0">
                  CG
                </div>

                {showSidebarText && (
                  <div className="min-w-0">
                    <h1 className="font-bold text-sm tracking-wide truncate">
                      Chad&apos;s Goon Cave
                    </h1>
                    <p className="text-[11px] text-slate-300/70 truncate">
                      Server Dashboard
                    </p>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => setSidebarCollapsed((prev) => !prev)}
                className={`w-8 h-8 rounded-lg bg-cyan-300/10 hover:bg-cyan-300/20 border border-cyan-300/20 text-cyan-100 items-center justify-center transition-all shrink-0 ${
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

          <nav className="flex-1 p-3 space-y-1.5">
            {showSidebarText && (
              <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-400/80 px-3 mb-2">
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
                    ? "is-active bg-cyan-300/15 text-white font-medium shadow-sm shadow-cyan-400/10"
                    : "text-slate-300/80 hover:text-white hover:bg-slate-300/10"
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

          <div className="p-3 border-t border-cyan-300/10">
            {showSidebarText ? (
                <div className="status-tile rounded-xl p-4 backdrop-blur-sm">
                <p className="text-xs font-medium text-slate-200/85">
                  System Status
                </p>

                <div className="flex items-center gap-2 mt-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]" />
                  <span className="text-xs text-emerald-400">Online</span>
                </div>

                <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-300/65 font-mono">
                  <Clock />
                </div>
              </div>
            ) : (
              <div
                title="System status · Online"
                className="status-tile hidden md:flex w-10 h-10 mx-auto rounded-xl items-center justify-center"
              >
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
              </div>
            )}
          </div>
        </aside>

       <main className="cyber-main flex-1 overflow-auto min-w-0">
  <div className="mobile-topbar md:hidden sticky top-0 z-30 px-3 py-3">
    <button
      type="button"
      className="inline-flex items-center justify-center p-2 rounded-lg bg-cyan-300/10 border border-cyan-300/20 text-cyan-100/80"
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
