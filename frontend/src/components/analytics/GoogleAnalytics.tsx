"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { ANALYTICS } from "@/config/constants";

const INTERACTION_EVENTS = ["pointerdown", "keydown", "touchstart", "scroll"] as const;
// Users who never interact still get counted, just a little later.
const FALLBACK_DELAY_MS = 5000;

/**
 * Loads gtag.js once, deferred until the first real user interaction (or a
 * fallback timeout) instead of during initial page load. GTM's script and
 * main-thread cost were the single largest contributor to LCP/TBT, so
 * keeping it off the critical path meaningfully helps load performance
 * without losing analytics coverage.
 * Skipped in development to avoid polluting analytics with local traffic.
 */
export function GoogleAnalytics() {
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || shouldLoad) {
      return;
    }

    const load = () => setShouldLoad(true);
    const fallback = window.setTimeout(load, FALLBACK_DELAY_MS);

    INTERACTION_EVENTS.forEach((event) =>
      window.addEventListener(event, load, { once: true, passive: true })
    );

    return () => {
      window.clearTimeout(fallback);
      INTERACTION_EVENTS.forEach((event) =>
        window.removeEventListener(event, load)
      );
    };
  }, [shouldLoad]);

  if (process.env.NODE_ENV !== "production" || !shouldLoad) {
    return null;
  }

  const measurementId = ANALYTICS.googleMeasurementId;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
      <Script id="google-analytics" strategy="afterInteractive">
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
