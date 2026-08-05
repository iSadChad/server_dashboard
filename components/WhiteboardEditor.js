"use client";

import dynamic from "next/dynamic";
import "@excalidraw/excalidraw/index.css";
import { serializeAsJSON } from "@excalidraw/excalidraw";


const Excalidraw = dynamic(
    async () => (await import("@excalidraw/excalidraw")).Excalidraw,
    {ssr: false}
);

export default function WhiteboardEditor({ noteId, initialDrawingData }) {
    async function handleChange(elements, appState) {
    if (!noteId) return;

    try {
        const drawingData = JSON.parse(
         serializeAsJSON({
            elements,
            appState,
         })
        );

        const response = await fetch(`/api/notes/${noteId}`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ drawingData }),
        });

        const data = await response.json();

        if (!response.ok) {
        throw new Error(data.message || "Failed to save drawing");
        }
        } catch (error) {
            console.error("Failed to save whiteboard:", error);
        }
    }
    return (
        <div className="relative h-[68dvh] min-h-110 max-h-160 w-full overflow-hidden bg-white sm:h-[72dvh] sm:min-h-130 lg:aspect-16/10 lg:h-auto lg:min-h-0 lg:max-h-none">
            <div className="h-full w-full">
                <Excalidraw
                initialData={initialDrawingData || null}
                onChange={handleChange} />
            </div>
        </div>
    );
}