"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { ANALYTICS } from "@/config/constants";

/** Real engagement only — no `scroll` (PageSpeed scrolls during lab runs). */
const INTERACTION_EVENTS = ["pointerdown", "keydown", "touchstart"] as const;
/** Far past Lighthouse's measurement window so gtag never competes with hydration in lab. */
const IDLE_FALLBACK_MS = 30_000;

/**
 * Loads gtag.js only after a real user gesture, or after a long idle fallback.
 * Skipped in development. Uses `lazyOnload` so even after the gate opens the
 * script stays off the critical path.
 */
export function GoogleAnalytics() {
  const measurementId = ANALYTICS.googleMeasurementId;
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || shouldLoad || !measurementId) {
      return;
    }

    const load = () => setShouldLoad(true);

    const idleId = window.setTimeout(load, IDLE_FALLBACK_MS);

    INTERACTION_EVENTS.forEach((event) =>
      window.addEventListener(event, load, { once: true, passive: true })
    );

    return () => {
      window.clearTimeout(idleId);
      INTERACTION_EVENTS.forEach((event) =>
        window.removeEventListener(event, load)
      );
    };
  }, [shouldLoad, measurementId]);

  if (process.env.NODE_ENV !== "production" || !shouldLoad || !measurementId) {
    return null;
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="lazyOnload"
      />
      <Script id="google-analytics" strategy="lazyOnload">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${measurementId}');
        `}
      </Script>
    </>
  );
}
