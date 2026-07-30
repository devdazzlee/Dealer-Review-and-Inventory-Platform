"use client";

import dynamic from "next/dynamic";
import { HeroSearchSkeleton } from "@/components/home/HeroSearchSkeleton";

// ssr:false keeps Radix Select out of the homepage required JS. Must live in
// a Client Component — next/dynamic ssr:false is invalid in Server Components.
const VehicleSearchBar = dynamic(
  () =>
    import("@/components/vehicles/VehicleSearchBar").then((m) => ({
      default: m.VehicleSearchBar,
    })),
  {
    loading: () => <HeroSearchSkeleton />,
    ssr: false,
  }
);

export function HomeHeroSearchLazy() {
  return <VehicleSearchBar layout="hero" submitLabel="Search" />;
}
