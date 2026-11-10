"use client";

import dynamic from "next/dynamic";
import "@excalidraw/excalidraw/index.css";
import { useEffect, useRef, useState } from "react";

const Excalidraw = dynamic(
  async () => (await import("@excalidraw/excalidraw")).Excalidraw,
  { ssr: false }
);

const containerClassName =
  "relative h-[68dvh] min-h-110 max-h-160 w-full overflow-hidden bg-white sm:h-[72dvh] sm:min-h-130 lg:aspect-16/10 lg:h-auto lg:min-h-0 lg:max-h-none";

export default function WhiteboardEditor() {
  const [drawingData, setDrawingData] = useState(null);
  const [whiteboardLoaded, setWhiteboardLoaded] = useState(false);
  const [whiteboardLoading, setWhiteboardLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [loadAttempt, setLoadAttempt] = useState(0);
  const saveTimeRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    async function loadWhiteboard() {
      setWhiteboardLoading(true);
      setLoadError("");

      try {
        const response = await fetch("/api/whiteboard", { cache: "no-store" });
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to load drawing");
        }

        if (!cancelled) {
          setDrawingData(data.drawingData ?? null);
          setWhiteboardLoaded(true);
        }
      } catch (error) {
        console.error("Failed to load whiteboard:", error);

        if (!cancelled) {
          setLoadError(error.message || "Failed to load drawing");
        }
      } finally {
        if (!cancelled) {
          setWhiteboardLoading(false);
        }
      }
    }

    loadWhiteboard();

    return () => {
      cancelled = true;

      if (saveTimeRef.current) {
        clearTimeout(saveTimeRef.current);
        saveTimeRef.current = null;
      }
    };
  }, [loadAttempt]);

  async function saveWhiteboard(dataToSave) {
    try {
      const response = await fetch("/api/whiteboard", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ drawingData: dataToSave }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to save drawing");
      }
    } catch (error) {
      console.error("Failed to save whiteboard:", error);
    }
  }

  function scheduleSave(dataToSave) {
    if (saveTimeRef.current) {
      clearTimeout(saveTimeRef.current);
    }

    saveTimeRef.current = setTimeout(() => {
      saveTimeRef.current = null;
      saveWhiteboard(dataToSave);
    }, 1000);
  }

  async function handleChange(elements, appState, files) {
    if (!whiteboardLoaded) {
      return;
    }

    try {
      const { serializeAsJSON } = await import("@excalidraw/excalidraw");
      const dataToSave = JSON.parse(
        serializeAsJSON(elements, appState, files, "database")
      );

      scheduleSave(dataToSave);
    } catch (error) {
      console.error("Failed to serialize drawing data:", error);
    }
  }

  if (whiteboardLoading) {
    return (
      <div className={`${containerClassName} flex items-center justify-center`}>
        <p className="text-sm text-slate-500">Loading whiteboard…</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className={`${containerClassName} flex flex-col items-center justify-center gap-3`}>
        <p className="text-sm text-slate-700">Could not load the whiteboard.</p>
        <button
          type="button"
          onClick={() => setLoadAttempt((attempt) => attempt + 1)}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700"
        >
          Try again
        </button>
      </div>
    );
  }

  return (
    <div className={containerClassName}>
      <div className="h-full w-full">
        <Excalidraw initialData={drawingData} onChange={handleChange} />
      </div>
    </div>
  );
}
