"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { ANALYTICS } from "@/config/constants";

const INTERACTION_EVENTS = ["pointerdown", "keydown", "touchstart", "scroll"] as const;
// Safari has no requestIdleCallback; fall back to a longer timer there only.
const NO_IDLE_CALLBACK_FALLBACK_MS = 8000;

/**
 * Loads gtag.js deferred until the first real user interaction, or true
 * browser idle time — never on a blind fixed timer, which would fire during
 * the busiest part of page load on a throttled connection and compete with
 * hydration for the same main thread. Skipped in development.
 */
export function GoogleAnalytics() {
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || shouldLoad) {
      return;
    }

    const load = () => setShouldLoad(true);

    const hasIdleCallback = "requestIdleCallback" in window;
    const idleId = hasIdleCallback
      ? window.requestIdleCallback(load, { timeout: 10000 })
      : window.setTimeout(load, NO_IDLE_CALLBACK_FALLBACK_MS);

    INTERACTION_EVENTS.forEach((event) =>
      window.addEventListener(event, load, { once: true, passive: true })
    );

    return () => {
      if (hasIdleCallback) {
        window.cancelIdleCallback(idleId as number);
      } else {
        window.clearTimeout(idleId as number);
      }
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
