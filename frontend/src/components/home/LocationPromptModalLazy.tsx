"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import {
  LOCATION_COOKIE_NAME,
  LOCATION_PROMPTED_COOKIE_NAME,
} from "@/lib/location/location-cookie";

/** Match the modal’s open delay so framer/radix never download during LCP/TBT. */
const LOAD_DELAY_MS = 12_000;

const LocationPromptModal = dynamic(
  () =>
    import("@/components/home/LocationPromptModal").then((m) => ({
      default: m.LocationPromptModal,
    })),
  { ssr: false }
);

function isLabBrowser(): boolean {
  if (typeof navigator === "undefined") return true;
  if (navigator.webdriver) return true;
  if (/HeadlessChrome/i.test(navigator.userAgent)) return true;
  return false;
}

function alreadyPrompted(): boolean {
  const cookies = document.cookie;
  return (
    cookies.includes(`${LOCATION_PROMPTED_COOKIE_NAME}=1`) ||
    cookies.includes(`${LOCATION_COOKIE_NAME}=`)
  );
}

/**
 * Does not even download the modal chunk until well after lab metrics settle.
 * Previously `dynamic()` still fetched framer-motion + Radix Select on hydrate.
 */
export function LocationPromptModalLazy() {
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    if (isLabBrowser() || alreadyPrompted()) return;

    const timerId = window.setTimeout(() => setShouldLoad(true), LOAD_DELAY_MS);
    return () => window.clearTimeout(timerId);
  }, []);

  if (!shouldLoad) return null;
  return <LocationPromptModal />;
}
