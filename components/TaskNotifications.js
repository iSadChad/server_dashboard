"use client";

import { useEffect, useState } from "react";

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);

  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let index = 0; index < rawData.length; index += 1) {
    outputArray[index] = rawData.charCodeAt(index);
  }

  return outputArray;
}

function isIosDevice() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent);
}

function isStandaloneApp() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true
  );
}

export default function TaskNotifications() {
  const [supported, setSupported] = useState(true);
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const pushSupported =
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window;

    setSupported(pushSupported);

    if (!pushSupported) {
      return;
    }

    navigator.serviceWorker
      .register("/sw.js", {
        scope: "/",
        updateViaCache: "none",
      })
      .then((registration) => registration.pushManager.getSubscription())
      .then((subscription) => {
        setEnabled(
          Boolean(subscription) && Notification.permission === "granted"
        );
      })
      .catch((error) => {
        console.error("Service worker registration failed:", error);
        setMessage("Could not register the service worker.");
      });
  }, []);

  async function enableNotifications() {
    setBusy(true);
    setMessage("");

    try {
      if (isIosDevice() && !isStandaloneApp()) {
        throw new Error(
          "Add the dashboard to your Home Screen and open it from there first."
        );
      }

      const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

      if (!publicKey) {
        throw new Error("The public VAPID key is missing.");
      }

      const registration = await navigator.serviceWorker.register("/sw.js", {
        scope: "/",
        updateViaCache: "none",
      });

      await navigator.serviceWorker.ready;

      const permission = await Notification.requestPermission();

      if (permission !== "granted") {
        throw new Error("Notification permission was not granted.");
      }

      let subscription =
        await registration.pushManager.getSubscription();

      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });
      }

      const response = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(subscription),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not save subscription.");
      }

      setEnabled(true);
      setMessage("Notifications enabled.");
    } catch (error) {
      console.error("Could not enable notifications:", error);
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function sendTestNotification() {
    setBusy(true);
    setMessage("");

    try {
      const response = await fetch("/api/push/test", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Could not send notification.");
      }

      setMessage(data.message);
    } catch (error) {
      console.error("Could not send test notification:", error);
      setMessage(error.message);
    } finally {
      setBusy(false);
    }
  }

  if (!supported) {
    return (
      <p className="text-xs text-amber-300">
        Push notifications are not supported here.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2 sm:items-end">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={enableNotifications}
          disabled={busy || enabled}
          className="vapor-button rounded-xl border border-fuchsia-300/25 bg-fuchsia-400/10 px-3 py-2 text-xs font-bold text-fuchsia-100 transition-all hover:border-cyan-300/40 hover:bg-cyan-300/10 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {enabled ? "Notifications Enabled" : "Enable Notifications"}
        </button>

        <button
          type="button"
          onClick={sendTestNotification}
          disabled={busy || !enabled}
          className="vapor-button rounded-xl border border-cyan-300/25 bg-cyan-300/10 px-3 py-2 text-xs font-bold text-cyan-100 transition-all hover:border-fuchsia-300/40 hover:bg-fuchsia-400/10 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? "Working..." : "Send Test"}
        </button>
      </div>

      {message && (
        <p className="max-w-sm text-xs text-violet-100/55">
          {message}
        </p>
      )}
    </div>
  );
}