"use client";

import dynamic from "next/dynamic";
import "@excalidraw/excalidraw/index.css";

const Excalidraw = dynamic(
    async () => (await import("@excalidraw/excalidraw")).Excalidraw,
    {ssr: false}
);

export default function WhiteboardEditor() {
    return (
        <div className="relative h-[68dvh] min-h-110 max-h-160 w-full overflow-hidden bg-white sm:h-[72dvh] sm:min-h-130 lg:h-[min(72dvh,720px)] lg:max-h-180">
            <div className="h-full w-full">
                <Excalidraw />
            </div>
        </div>
    );
}
