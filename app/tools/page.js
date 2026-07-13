"use client";

import PageLayout from "../../components/PageLayout";

function cleanUrl(url) {
  return url.replace(/\/+$/, "");
}

export default function ToolsPage() {
  const snapotterUrl = cleanUrl(
    process.env.NEXT_PUBLIC_SNAPOTTER_URL || "http://100.82.53.61:1349"
  );

  const stirlingPdfUrl = cleanUrl(
    process.env.NEXT_PUBLIC_STIRLING_PDF_URL || "http://100.82.53.61:8081"
  );

  const actualBudgetUrl = cleanUrl(
    process.env.NEXT_PUBLIC_ACTUAL_BUDGET_URL ||
      "https://chadsgooncave.tailbfa409.ts.net"
  );
  const bumteacherbypassUrl = cleanUrl(
    process.env.NEXT_PUBLIC_BUMTEACHERBYPASS_URL ||
      "http://100.82.53.61:3847"
  );

  const tools = [
    {
      title: "SnapOtter",
      description: "File processing, conversion and compression tools.",
      url: snapotterUrl,
      buttonLabel: "Open SnapOtter",
      icon: "M4 7h16M4 12h16M4 17h16",
      accent: "steel",
      meta: "Files",
    },
    {
      title: "Stirling PDF",
      description: "Merge, split, compress and convert PDFs.",
      url: stirlingPdfUrl,
      buttonLabel: "Open Stirling PDF",
      icon: "M7 3h7l5 5v13H7a2 2 0 01-2-2V5a2 2 0 012-2z",
      accent: "ember",
      meta: "PDF",
    },
    {
      title: "Actual Budget",
      description: "Personal finance and spending tracker.",
      url: actualBudgetUrl,
      buttonLabel: "Open Actual Budget",
      icon: "M3 7a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7zm14 5h.01M7 9h6",
      accent: "moss",
      meta: "Finance",
    },
    {
      title: "AdGuard Home",
      description: "Network-wide DNS ad and tracker blocking.",
      url: "http://100.82.53.61:3001",
      buttonLabel: "Open AdGuard",
      icon: "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
      accent: "violet",
      meta: "DNS",
    },
    {
      title: "BumTeacherBypass",
      description:
        "Upload PDF and Word files and convert them into organized, editable pages using AI.",
      url: bumteacherbypassUrl,
      buttonLabel: "Open BumTeacherBypass",
      icon: "M4 19.5A2.5 2.5 0 016.5 17H20M4 19.5A2.5 2.5 0 016.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z",
      accent: "blood",
      meta: "Docs",
    },
  ];

  return (
    <PageLayout>
      <div className="vapor-page tools-workbench px-3 py-5 sm:px-5 lg:px-8 lg:py-9">
        <header className="vapor-header tool-terminal-header relative mb-6 overflow-hidden rounded-3xl border border-fuchsia-300/25 bg-linear-to-br from-fuchsia-500/20 via-violet-950/60 to-cyan-400/10 shadow-[0_0_55px_rgba(217,70,239,0.16)]">
          <div className="tool-header-orbit pointer-events-none absolute -top-16 -right-12 h-48 w-48 rounded-full border border-cyan-200/15 shadow-[0_0_60px_rgba(34,211,238,0.14)]" />
          <div className="relative z-10 flex max-w-5xl flex-col gap-3">
            <div className="flex items-center gap-3">
              <span className="h-px w-10 bg-linear-to-r from-fuchsia-400 to-cyan-300" />
              <p className="vapor-kicker font-mono text-[10px] font-bold uppercase tracking-[0.34em] text-cyan-300/80">
                Utility arcade // launch control
              </p>
            </div>

            <h2 className="vapor-title text-3xl font-black tracking-tighter text-white sm:text-4xl lg:text-5xl">
              Choose your{" "}
              <span className="bg-linear-to-r from-fuchsia-300 via-pink-200 to-cyan-200 bg-clip-text text-transparent">
                destination.
              </span>
            </h2>

            <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center">
              <p className="vapor-muted max-w-xl text-sm leading-relaxed text-violet-100/55">
                Jump straight into the services running beyond the dashboard.
                Every portal opens in a new tab.
              </p>
              <p className="vapor-chip w-fit shrink-0 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 font-mono text-xs uppercase tracking-wider text-cyan-100 sm:ml-auto">
                {tools.length} portals online
              </p>
            </div>
          </div>
        </header>

        <section className="tool-launch-stage lg:grid lg:grid-cols-[minmax(210px,0.38fr)_minmax(0,1fr)] lg:items-start lg:gap-6 xl:gap-9">
          <aside className="tool-launch-manifest vapor-panel mb-5 rounded-3xl border border-cyan-300/15 bg-violet-950/35 p-5 shadow-[0_22px_60px_rgba(20,0,60,0.28)] backdrop-blur-xl lg:sticky lg:top-6 lg:mb-0 lg:p-6">
            <p className="vapor-kicker font-mono text-[10px] font-bold uppercase tracking-[0.28em] text-cyan-300/60">
              Portal manifest
            </p>
            <p className="mt-3 text-2xl font-black tracking-tight text-fuchsia-50">
              External deck
            </p>
            <p className="vapor-muted mt-2 text-xs leading-relaxed text-violet-100/45">
              Select a service terminal, verify its endpoint, then launch.
            </p>

            <div className="tool-signal-bank mt-6 space-y-2 border-t border-fuchsia-200/10 pt-5">
              <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-wider text-violet-100/35">
                <span>Signal</span>
                <span>Stable</span>
              </div>
              <div className="flex h-7 items-end gap-1.5">
                <span className="h-2 flex-1 rounded-sm bg-fuchsia-400/35" />
                <span className="h-3 flex-1 rounded-sm bg-fuchsia-400/45" />
                <span className="h-4 flex-1 rounded-sm bg-violet-400/55" />
                <span className="h-5 flex-1 rounded-sm bg-cyan-400/65" />
                <span className="h-7 flex-1 rounded-sm bg-cyan-300 shadow-[0_0_14px_rgba(103,232,249,0.4)]" />
              </div>
            </div>
          </aside>

          <div className="tool-portal-track space-y-3 sm:space-y-4">
            {tools.map((tool, index) => (
              <ToolRow key={tool.title} tool={tool} index={index + 1} />
            ))}
          </div>
        </section>
      </div>
    </PageLayout>
  );
}

const accentStyles = {
  steel: {
    dot: "bg-cyan-300 shadow-[0_0_14px_rgba(103,232,249,0.75)]",
    icon: "border-cyan-300/25 bg-cyan-300/10 text-cyan-100",
  },
  ember: {
    dot: "bg-pink-400 shadow-[0_0_14px_rgba(244,114,182,0.72)]",
    icon: "border-pink-300/25 bg-pink-400/10 text-pink-100",
  },
  moss: {
    dot: "bg-teal-300 shadow-[0_0_14px_rgba(94,234,212,0.7)]",
    icon: "border-teal-300/25 bg-teal-300/10 text-teal-100",
  },
  violet: {
    dot: "bg-violet-300 shadow-[0_0_14px_rgba(196,181,253,0.72)]",
    icon: "border-violet-300/25 bg-violet-300/10 text-violet-100",
  },
  blood: {
    dot: "bg-fuchsia-400 shadow-[0_0_14px_rgba(232,121,249,0.78)]",
    icon: "border-fuchsia-300/25 bg-fuchsia-400/10 text-fuchsia-100",
  },
};

function ToolIcon({ tool }) {
  const style = accentStyles[tool.accent] || accentStyles.steel;

  return (
    <div
      className={`vapor-icon tool-portal-icon flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_0_24px_rgba(217,70,239,0.12)] ${style.icon}`}
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
      >
        <path d={tool.icon} />
      </svg>
    </div>
  );
}

function ToolRow({ tool, index }) {
  const style = accentStyles[tool.accent] || accentStyles.steel;

  return (
    <article className="vapor-panel tool-portal-card group relative overflow-hidden rounded-3xl border border-fuchsia-300/18 bg-linear-to-br from-violet-950/70 via-fuchsia-950/35 to-cyan-950/25 p-4 shadow-[0_18px_52px_rgba(20,0,60,0.28)] transition-all duration-500 hover:-translate-y-1 hover:border-cyan-200/35 hover:shadow-[0_24px_64px_rgba(34,211,238,0.12)]">
      <span className="tool-portal-watermark pointer-events-none absolute -top-5 right-2 font-mono text-7xl font-black tracking-tighter text-fuchsia-200/4 sm:text-8xl">
        {String(index).padStart(2, "0")}
      </span>

      <div className="relative z-10">
        <div className="flex items-start gap-3">
          <ToolIcon tool={tool} />

          <div className="min-w-0 flex-1 pt-0.5">
            <div className="flex flex-wrap items-center gap-2 font-mono text-[9px] font-bold uppercase tracking-[0.2em]">
              <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
              <span className="text-cyan-200/45">
                Portal {String(index).padStart(2, "0")}
              </span>
              <span className="text-violet-200/20">{"//"}</span>
              <span className="text-fuchsia-200/60">{tool.meta}</span>
            </div>

            <h3 className="mt-1 text-lg font-black tracking-tight text-fuchsia-50 transition-colors group-hover:text-cyan-100 sm:text-xl">
              {tool.title}
            </h3>
            <p className="vapor-muted mt-0.5 line-clamp-2 max-w-2xl text-xs leading-relaxed text-violet-100/50">
              {tool.description}
            </p>

            <div className="tool-endpoint-display mt-2 flex min-w-0 items-center gap-2 rounded-xl border border-cyan-300/12 bg-violet-950/60 px-3 py-2 shadow-inner">
              <p className="shrink-0 font-mono text-[8px] font-bold uppercase tracking-[0.2em] text-cyan-200/35">
                Destination endpoint
              </p>
              <span className="text-cyan-200/20">{"//"}</span>
              <p className="min-w-0 truncate font-mono text-[10px] text-cyan-50/55 sm:text-[11px]">
                {tool.url}
              </p>
            </div>
          </div>
        </div>

        <a
          href={tool.url}
          target="_blank"
          rel="noreferrer"
          className="vapor-button tool-portal-launch mt-3 flex w-full items-center justify-between rounded-xl border border-fuchsia-200/35 bg-linear-to-r from-fuchsia-500 via-violet-500 to-cyan-500 px-5 py-3 text-xs font-black uppercase tracking-[0.14em] text-white shadow-[0_0_26px_rgba(217,70,239,0.22)] transition-all duration-300 hover:scale-[1.01] hover:border-cyan-100/70 hover:shadow-[0_0_36px_rgba(34,211,238,0.28)] sm:text-sm"
        >
          <span>{tool.buttonLabel}</span>
          <span className="flex h-7 w-7 items-center justify-center rounded-full border border-white/25 bg-white/10 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1">
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M7 17 17 7" />
              <path d="M7 7h10v10" />
            </svg>
          </span>
        </a>
      </div>
    </article>
  );
}
