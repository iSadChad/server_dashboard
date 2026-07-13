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
        <div className="vapor-header tool-terminal-header relative mb-6 overflow-hidden rounded-3xl border border-fuchsia-300/25 bg-linear-to-br from-fuchsia-500/15 via-violet-500/10 to-cyan-400/10 px-5 py-6 shadow-[0_0_55px_rgba(217,70,239,0.16)] sm:px-7 sm:py-8">
          <div className="relative z-10 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="vapor-kicker mb-2 font-mono text-[10px] font-bold uppercase tracking-[0.32em] text-cyan-300/80">
                Utility arcade // external deck
              </p>
              <h2 className="vapor-title text-3xl font-black tracking-tight text-white sm:text-5xl">
              Tools
              </h2>
            </div>
            <p className="vapor-chip w-fit rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 font-mono text-xs uppercase tracking-wider text-cyan-100">
              {tools.length} portals online
            </p>
          </div>
        </div>

        <div className="vapor-panel tool-directory overflow-hidden rounded-3xl border border-fuchsia-300/20 bg-violet-950/30 shadow-[0_24px_80px_rgba(20,0,60,0.35)] backdrop-blur-xl">
          <div className="vapor-directory-head grid grid-cols-[56px_minmax(0,1fr)_88px] border-b border-cyan-200/15 bg-linear-to-r from-fuchsia-500/10 to-cyan-400/10 px-4 py-4 font-mono text-[10px] uppercase tracking-[0.24em] text-cyan-200/60 md:grid-cols-[72px_minmax(0,1.2fr)_minmax(0,1fr)_120px]">
            <span>Slot</span>
            <span>Service</span>
            <span className="hidden md:block">Endpoint</span>
            <span className="text-right">Action</span>
          </div>

          <div className="divide-y divide-fuchsia-200/10">
            {tools.map((tool, index) => (
              <ToolRow key={tool.title} tool={tool} index={index + 1} />
            ))}
          </div>
        </div>
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
      className={`vapor-icon flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border shadow-inner ${style.icon}`}
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
    <div className="vapor-list-row tool-row group grid grid-cols-[56px_minmax(0,1fr)_88px] items-center gap-0 px-4 py-4 transition-all duration-300 hover:bg-fuchsia-400/8 md:grid-cols-[72px_minmax(0,1.2fr)_minmax(0,1fr)_120px]">
      <div className="flex items-center gap-3">
        <span className={`h-2 w-2 rounded-full ${style.dot}`} />
        <span className="font-mono text-xs text-cyan-200/45">
          {String(index).padStart(2, "0")}
        </span>
      </div>

      <div className="flex min-w-0 items-center gap-3">
        <ToolIcon tool={tool} />
        <div className="min-w-0">
          <h3 className="truncate text-sm font-bold tracking-wide text-fuchsia-50 transition-colors group-hover:text-cyan-100">
            {tool.title}
          </h3>
          <p className="vapor-muted truncate text-xs text-violet-100/55">{tool.description}</p>
        </div>
      </div>

      <p className="hidden min-w-0 break-all pr-4 font-mono text-[11px] text-cyan-100/35 md:block">
        {tool.url}
      </p>

      <a
        href={tool.url}
        target="_blank"
        rel="noreferrer"
        className="vapor-button inline-flex items-center justify-center rounded-xl border border-fuchsia-300/30 bg-linear-to-r from-fuchsia-500/20 to-cyan-400/15 px-3 py-2.5 text-xs font-bold uppercase tracking-wider text-fuchsia-50 shadow-[0_0_20px_rgba(217,70,239,0.1)] transition-all duration-300 hover:-translate-y-0.5 hover:border-cyan-200/60 hover:shadow-[0_0_24px_rgba(34,211,238,0.2)]"
      >
        Launch
      </a>
    </div>
  );
}
