"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { HeroSearchSkeleton } from "@/components/home/HeroSearchSkeleton";

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

/**
 * Keep Radix Select off the critical path: show a dimension-matched skeleton
 * until idle (or first input). `dynamic()` alone still starts the chunk fetch
 * on mount, which competes with hydration and inflates TBT.
 */
export function HomeHeroSearchLazy() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let idleId: number | undefined;
    let timerId: number | undefined;

    const start = () => {
      if (!cancelled) setReady(true);
    };

    const onInteract = () => start();
    window.addEventListener("pointerdown", onInteract, {
      once: true,
      passive: true,
    });
    window.addEventListener("keydown", onInteract, { once: true });

    if (typeof window.requestIdleCallback === "function") {
      idleId = window.requestIdleCallback(start, { timeout: 3500 });
    } else {
      timerId = window.setTimeout(start, 2000);
    }

    return () => {
      cancelled = true;
      window.removeEventListener("pointerdown", onInteract);
      window.removeEventListener("keydown", onInteract);
      if (idleId !== undefined) window.cancelIdleCallback(idleId);
      if (timerId !== undefined) window.clearTimeout(timerId);
    };
  }, []);

  if (!ready) return <HeroSearchSkeleton />;
  return <VehicleSearchBar layout="hero" submitLabel="Search" />;
}
