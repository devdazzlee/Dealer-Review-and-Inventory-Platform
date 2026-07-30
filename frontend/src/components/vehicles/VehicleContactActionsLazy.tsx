"use client";

import dynamic from "next/dynamic";

// ssr:false keeps the booking widget (and its react-day-picker/date-fns
// dependency) out of the vehicle detail route's required hydration bundle.
// It's an interactive scheduling form with no SEO value, so nothing is lost
// by mounting it client-side only — but it does mean Next's Link prefetch
// no longer pulls this weight into every homepage/listing card that links
// here. ssr:false isn't allowed inside a Server Component, hence this
// dedicated client wrapper.
export const VehicleContactActionsLazy = dynamic(
  () =>
    import("@/components/vehicles/VehicleContactActions").then((m) => ({
      default: m.VehicleContactActions,
    })),
  {
    ssr: false,
    loading: () => (
      <div
        className="h-[6.5rem] animate-pulse rounded-lg bg-muted sm:h-[6.25rem]"
        aria-hidden
      />
    ),
  }
);
