"use client";

import dynamic from "next/dynamic";
import "@excalidraw/excalidraw/index.css";

const Excalidraw = dynamic(
    async () => (await import("@excalidraw/excalidraw")).Excalidraw,
    {ssr: false}
);

export default function WhiteboardEditor() {
    return (
        <div className="h-175 w-full">
            <Excalidraw />
        </div>
    );
}
