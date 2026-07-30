"use client";

import dynamic from "next/dynamic";

// ssr:false keeps framer-motion out of the /vehicles route's required
// hydration bundle. This drawer is mobile-only chrome (hidden via lg:hidden
// even when SSR'd) with no SEO value, so nothing is lost by mounting it
// client-side only. ssr:false isn't allowed inside a Server Component,
// hence this dedicated client wrapper.
export const MobileFilterDrawerLazy = dynamic(
  () =>
    import("@/components/vehicles/MobileFilterDrawer").then((m) => ({
      default: m.MobileFilterDrawer,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="h-10 w-full animate-pulse rounded-lg bg-muted lg:hidden" aria-hidden />
    ),
  }
);
