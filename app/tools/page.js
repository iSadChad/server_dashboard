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

  const featured = tools[4];
  const quickTools = tools.slice(0, 4);


  return (
    <PageLayout>
      <div className="tools-workbench px-3 py-4 sm:px-5 lg:px-8 lg:py-7">
        <div className="mb-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
          <section className="tool-hero rounded-xl border p-4 sm:p-6 lg:p-7">
            <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.025] px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest text-slate-300/55">
                <span className="h-1.5 w-1.5 rounded-full bg-red-400 shadow-[0_0_12px_rgba(248,113,113,0.75)]" />
                Tool Bay
              </div>

              <div className="font-mono text-[11px] text-slate-400/55">
                {tools.length} services linked
              </div>
            </div>

            <h2 className="max-w-3xl text-3xl font-black tracking-normal text-white sm:text-5xl lg:text-6xl">
              Dark launch deck for the stuff you actually use.
            </h2>

            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-400">
              Self-hosted utilities, grouped like a control surface instead of
              a pile of identical tiles.
            </p>

            <div className="mt-9 grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
              <div className="min-w-0">
                <p className="font-mono text-[10px] uppercase tracking-widest text-red-300/50">
                  Featured route
                </p>
                <h3 className="mt-2 truncate text-2xl font-bold text-white">
                  {featured.title}
                </h3>
                <p className="mt-2 max-w-xl text-sm text-slate-400">
                  {featured.description}
                </p>
              </div>

              <LaunchButton tool={featured} large />
            </div>
          </section>

          <aside className="tool-side-stack grid gap-3">
            {quickTools.map((tool, index) => (
              <MiniLaunch key={tool.title} tool={tool} index={index + 1} />
            ))}
          </aside>
        </div>

        <div className="tool-directory rounded-xl border">
          <div className="grid grid-cols-[64px_minmax(0,1fr)] border-b border-white/10 px-4 py-3 text-[10px] font-mono uppercase tracking-widest text-slate-500 sm:grid-cols-[72px_minmax(0,1.2fr)_minmax(0,1fr)_150px]">
            <span>Slot</span>
            <span>Service</span>
            <span className="hidden sm:block">Endpoint</span>
            <span className="hidden sm:block text-right">Action</span>
          </div>

          <div className="divide-y divide-white/[0.07]">
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
    dot: "bg-slate-300 shadow-[0_0_12px_rgba(203,213,225,0.45)]",
    icon: "border-slate-400/20 bg-slate-300/10 text-slate-100",
  },
  ember: {
    dot: "bg-orange-400 shadow-[0_0_12px_rgba(251,146,60,0.42)]",
    icon: "border-orange-300/20 bg-orange-300/10 text-orange-100",
  },
  moss: {
    dot: "bg-lime-500 shadow-[0_0_12px_rgba(132,204,22,0.35)]",
    icon: "border-lime-300/20 bg-lime-300/10 text-lime-100",
  },
  violet: {
    dot: "bg-violet-400 shadow-[0_0_12px_rgba(167,139,250,0.36)]",
    icon: "border-violet-300/20 bg-violet-300/10 text-violet-100",
  },
  blood: {
    dot: "bg-red-500 shadow-[0_0_14px_rgba(239,68,68,0.48)]",
    icon: "border-red-300/20 bg-red-500/10 text-red-100",
  },
};

function ToolIcon({ tool }) {
  const style = accentStyles[tool.accent] || accentStyles.steel;

  return (
    <div
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border ${style.icon}`}
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

function LaunchButton({ tool, large = false }) {
  return (
    <a
      href={tool.url}
      target="_blank"
      rel="noreferrer"
      className={`launch-button inline-flex items-center justify-center rounded-lg border border-red-400/20 bg-red-500/10 font-semibold text-red-100 transition-all hover:bg-red-500/15 ${
        large ? "px-5 py-3 text-sm" : "px-3 py-2 text-xs"
      }`}
    >
      {tool.buttonLabel}
    </a>
  );
}

function MiniLaunch({ tool, index }) {
  const style = accentStyles[tool.accent] || accentStyles.steel;

  return (
    <section className="mini-launch rounded-xl border p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className="font-mono text-xs text-slate-500">
            {String(index).padStart(2, "0")}
          </span>
          <ToolIcon tool={tool} />
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-white">
              {tool.title}
            </h3>
            <p className="font-mono text-[10px] uppercase tracking-widest text-slate-500">
              {tool.meta}
            </p>
          </div>
        </div>
        <span className={`h-2 w-2 shrink-0 rounded-full ${style.dot}`} />
      </div>

      <p className="mb-4 line-clamp-2 text-xs leading-5 text-slate-400">
        {tool.description}
      </p>

      <LaunchButton tool={tool} />
    </section>
  );
}

function ToolRow({ tool, index }) {
  const style = accentStyles[tool.accent] || accentStyles.steel;

  return (
    <div className="tool-row grid grid-cols-[64px_minmax(0,1fr)] items-center gap-0 px-4 py-4 sm:grid-cols-[72px_minmax(0,1.2fr)_minmax(0,1fr)_150px]">
      <div className="flex items-center gap-3">
        <span className={`h-2 w-2 rounded-full ${style.dot}`} />
        <span className="font-mono text-xs text-slate-500">
          {String(index).padStart(2, "0")}
        </span>
      </div>

      <div className="flex min-w-0 items-center gap-3">
        <ToolIcon tool={tool} />
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-white">
            {tool.title}
          </h3>
          <p className="truncate text-xs text-slate-500">{tool.description}</p>
        </div>
      </div>

      <p className="hidden min-w-0 break-all pr-4 font-mono text-[11px] text-slate-500 sm:block">
        {tool.url}
      </p>

      <a
        href={tool.url}
        target="_blank"
        rel="noreferrer"
        className="mt-3 inline-flex items-center justify-center rounded-lg border border-white/10 bg-white/[0.035] px-3 py-2 text-xs font-medium text-slate-200 transition-all hover:border-red-300/25 hover:bg-red-500/10 sm:mt-0"
      >
        Launch
      </a>
    </div>
  );
}
