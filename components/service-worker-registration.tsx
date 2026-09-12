"use client";

import { useEffect } from "react";

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    let cancelled = false;
    const clearLegacyWorkers = async () => {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((registration) => registration.unregister()));

      if ("caches" in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));
      }

      if (!cancelled) navigator.serviceWorker.controller?.postMessage({ type: "CLEAR_LEGACY_CACHE" });
    };

    void clearLegacyWorkers().catch(() => undefined);
    return () => { cancelled = true };
  }, []);

  return null;
}
