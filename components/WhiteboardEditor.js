"use client";

import dynamic from "next/dynamic";
import "@excalidraw/excalidraw/index.css";
import { useState, useRef } from "react";

const Excalidraw = dynamic(
    async () => (await import("@excalidraw/excalidraw")).Excalidraw,
    {ssr: false}
);

const [drawingData, setDrawingData] = useState(null);
const [loadWhiteboard, setLoadWhiteboard] = useState(false);

const saveTimeRef = useRef(null);

export default function WhiteboardEditor() {
    async function loadWhiteboard() {
        try {
            const response = await fetch(`/api/whiteboard`);
            const data = await response.json();
            setDrawingData(data.drawingData);
        } catch (error) {
            console.error("Failed to load whiteboard:", error);
        }
    }

    async function saveWhiteboard(drawingData) {
        try {
            const response = await fetch(`/api/whiteboard`, {
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


    function scheduleSave(drawingData) {
        try {
            if (saveTimeRef.current) {
                clearTimeout(saveTimeRef.current);
            }
        } catch (error) {
            console.error("Error clearing save timeout:", error);
        }
    }
    
    async function handleChange(elements, appState) {
    if (!noteId) return;

    try {
        const { serializeAsJSON } = await import(
            "@excalidraw/excalidraw"
        );
        
        const drawingData = JSON.parse(
         serializeAsJSON({
            elements,
            appState,
         })
        );

        const response = await fetch(`/api/whiteboard`, {
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

    useEffect(() => {
        if (!loadWhiteboard) {
            loadWhiteboard();
            setLoadWhiteboard(true);
        }
    }, [loadWhiteboard]);
    
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

