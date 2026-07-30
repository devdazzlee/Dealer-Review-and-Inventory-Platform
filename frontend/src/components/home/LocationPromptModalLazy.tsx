"use client";

import dynamic from "next/dynamic";

// ssr:false keeps framer-motion — and everything else this modal pulls in —
// out of the initial/hydration-required bundle on every page. The modal is
// a client-only location prompt that already waits 600ms before opening and
// has no SEO value, so nothing is lost by mounting it after hydration
// instead of bundling it into first load. ssr:false isn't allowed inside a
// Server Component, hence this dedicated client wrapper.
export const LocationPromptModalLazy = dynamic(
  () =>
    import("@/components/home/LocationPromptModal").then((m) => ({
      default: m.LocationPromptModal,
    })),
  { ssr: false }
);
