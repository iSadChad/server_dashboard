"use client";

import dynamic from "next/dynamic";
import "@excalidraw/excalidraw/index.css";

const Excalidraw = dynamic(
    async () => (await import("@excalidraw/excalidraw")).Excalidraw,
    {ssr: false}
);

export default function WhiteboardEditor() {
    return (
        <div className="relative h-[60dvh] min-h-100 max-h-150 w-full overflow-hidden rounded-2xl border border-cyan-300/15 bg-violet-950/30 shadow-[0_18px_52px_rgba(20,0,60,0.28)] sm:h-[65dvh] sm:min-h-125 lg:h-175 lg:max-h-175">
            <div className="h-full w-full">
                <Excalidraw />
            </div>
        </div>
    );
}
