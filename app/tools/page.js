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

  return (
    <PageLayout>
      <div className="p-3 sm:p-4 lg:p-8">
        <div className="mb-6 md:mb-8">
          <h2 className="text-xl md:text-2xl font-bold">Tools</h2>
          <p className="text-red-200/40 text-sm mt-1">
            Self-hosted utilities running on your server
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4">
          <ToolCard
            title="SnapOtter"
            description="File processing, conversion and compression tools."
            url={snapotterUrl}
            buttonLabel="Open SnapOtter"
            icon="M4 7h16M4 12h16M4 17h16"
          />

          <ToolCard
            title="Stirling PDF"
            description="PDF tools for merging, splitting, compressing and converting PDFs."
            url={stirlingPdfUrl}
            buttonLabel="Open Stirling PDF"
            icon="M7 3h7l5 5v13H7a2 2 0 01-2-2V5a2 2 0 012-2z"
          />
        </div>
      </div>
    </PageLayout>
  );
}

function ToolCard({ title, description, url, buttonLabel, icon }) {
  return (
    <section className="rounded-2xl bg-white/[0.03] backdrop-blur-sm border border-red-500/10 p-4 md:p-6 min-w-0">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="min-w-0">
          <h3 className="text-lg md:text-xl font-bold text-red-100 truncate">
            {title}
          </h3>

          <p className="text-sm text-red-200/40 mt-1">{description}</p>
        </div>

        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center shadow-lg shadow-red-500/20 shrink-0">
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
      </div>

      <p className="text-xs text-red-300/30 font-mono break-all mb-4">
        {url}
      </p>

      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="inline-flex w-full items-center justify-center rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-300 px-3 py-3 text-sm font-medium transition-all"
      >
        {buttonLabel}
      </a>
    </section>
  );
}