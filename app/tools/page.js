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


  return (
    <PageLayout>
      <div className="p-3 sm:p-4 lg:p-8">
        <div className="mb-6 md:mb-8 grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-300/15 bg-cyan-300/5 px-3 py-1 text-[10px] font-mono uppercase tracking-widest text-cyan-100/55">
              <span className="h-1.5 w-1.5 rounded-full bg-lime-300 shadow-[0_0_10px_rgba(163,230,53,0.75)]" />
              Utility Mesh
            </div>

            <h2 className="text-2xl md:text-4xl font-black tracking-normal">
              Tools
            </h2>

            <p className="text-red-200/40 text-sm mt-2 max-w-2xl">
              Self-hosted utilities running on your server, tuned for quick
              jumps instead of menu hunting.
            </p>
          </div>

          <div className="hidden lg:flex items-center gap-2 rounded-2xl border border-cyan-300/15 bg-black/20 px-4 py-3 font-mono text-xs text-cyan-100/45">
            <span>{new URL(snapotterUrl).hostname}</span>
            <span className="text-pink-300/50">/</span>
            <span>{new URL(stirlingPdfUrl).port || "443"}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-3 md:gap-4">
          <ToolCard
            title="SnapOtter"
            description="File processing, conversion and compression tools."
            url={snapotterUrl}
            buttonLabel="Open SnapOtter"
            icon="M4 7h16M4 12h16M4 17h16"
            accent="cyan"
            className="xl:col-span-2"
          />

          <ToolCard
            title="Stirling PDF"
            description="PDF tools for merging, splitting, compressing and converting PDFs."
            url={stirlingPdfUrl}
            buttonLabel="Open Stirling PDF"
            icon="M7 3h7l5 5v13H7a2 2 0 01-2-2V5a2 2 0 012-2z"
            accent="pink"
            className="xl:col-span-2"
          />

          <ToolCard
            title="Actual Budget"
            description="Personal finance and spending tracker."
            url={actualBudgetUrl}
            buttonLabel="Open Actual Budget"
            icon="M3 7a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7zm14 5h.01M7 9h6"
            accent="lime"
            className="xl:col-span-2"
          />

          <ToolCard
          title="AdGuard Home"
          description="Network-wide DNS ad and tracker blocking."
          url="http://100.82.53.61:3001"
          buttonLabel="Open AdGuard"
          icon="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
          accent="violet"
          className="xl:col-span-3"
/>
<ToolCard
          title="BumTeacherBypass"
          description="Upload PDF and Word files and convert them into organized, editable pages using AI."
          url={bumteacherbypassUrl}
          buttonLabel="Open BumTeacherBypass"
          icon="M4 19.5A2.5 2.5 0 016.5 17H20M4 19.5A2.5 2.5 0 016.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"
          accent="orange"
          className="xl:col-span-3"
/>
        </div>
      </div>
    </PageLayout>
  );
}

const accentStyles = {
  cyan: {
    ring: "from-cyan-300 to-sky-500 shadow-cyan-400/20",
    chip: "text-cyan-200 border-cyan-300/20 bg-cyan-300/10",
  },
  pink: {
    ring: "from-fuchsia-400 to-rose-500 shadow-pink-500/20",
    chip: "text-pink-200 border-pink-300/20 bg-pink-300/10",
  },
  lime: {
    ring: "from-lime-300 to-emerald-500 shadow-lime-400/20",
    chip: "text-lime-200 border-lime-300/20 bg-lime-300/10",
  },
  violet: {
    ring: "from-violet-400 to-cyan-400 shadow-violet-500/20",
    chip: "text-violet-200 border-violet-300/20 bg-violet-300/10",
  },
  orange: {
    ring: "from-amber-300 to-pink-500 shadow-amber-400/20",
    chip: "text-amber-200 border-amber-300/20 bg-amber-300/10",
  },
};

function ToolCard({ title, description, url, buttonLabel, icon, accent, className = "" }) {
  const style = accentStyles[accent] || accentStyles.cyan;

  return (
    <section className={`tool-card rounded-2xl bg-white/[0.03] backdrop-blur-sm border border-red-500/10 p-4 md:p-6 min-w-0 ${className}`}>
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="min-w-0">
          <h3 className="text-lg md:text-xl font-bold text-red-100 truncate">
            {title}
          </h3>

          <p className="text-sm text-red-200/40 mt-1">{description}</p>
        </div>

        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${style.ring} flex items-center justify-center shadow-lg shrink-0`}>
          <svg
            width="19"
            height="19"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d={icon} />
          </svg>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-4">
        <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]" />
        <span className="text-xs font-mono text-emerald-400">Available</span>
        <span className={`ml-auto rounded-full border px-2 py-1 text-[10px] font-mono uppercase tracking-wider ${style.chip}`}>
          External
        </span>
      </div>

      <p className="text-xs text-red-300/30 font-mono break-all mb-4">
        {url}
      </p>

      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="inline-flex w-full items-center justify-center rounded-lg bg-cyan-300/10 hover:bg-cyan-300/20 border border-cyan-300/20 text-cyan-100 px-3 py-3 text-sm font-medium transition-all"
      >
        {buttonLabel}
      </a>
    </section>
  );
}
