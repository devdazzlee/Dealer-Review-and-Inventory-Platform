"use client";

import dynamic from "next/dynamic";
import { useCompare } from "@/contexts/compare-context";

const CompareTray = dynamic(
  () =>
    import("@/components/vehicles/CompareTray").then((m) => ({
      default: m.CompareTray,
    })),
  { ssr: false }
);

/** Avoid pulling VehiclePhoto / tray UI into the initial bundle when empty. */
export function CompareTrayLazy() {
  const { vehicles } = useCompare();
  if (vehicles.length === 0) return null;
  return <CompareTray />;
}
