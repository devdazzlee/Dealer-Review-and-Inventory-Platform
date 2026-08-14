"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart } from "lucide-react";
import type { Vehicle } from "@/types/vehicle";
import { env } from "@/config/env";
import { ROUTES } from "@/config/constants";
import { useSavedVehicles } from "@/contexts/saved-vehicles-context";
import { SavedVehicleCard } from "@/components/vehicles/SavedVehicleCard";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";

export function SavedVehiclesList() {
  const { savedIds, hydrated, count } = useSavedVehicles();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);

  useEffect(() => {
    if (!hydrated) return;
    const ids = Array.from(savedIds);
    if (ids.length === 0) {
      setVehicles([]);
      return;
    }
    void Promise.all(
      ids.map(async (id) => {
        const response = await fetch(`${env.apiBaseUrl}/api/vehicles/${id}`);
        if (!response.ok) return null;
        const payload = (await response.json()) as { vehicle: Vehicle };
        return payload.vehicle;
      })
    ).then((rows) => {
      setVehicles(rows.filter((row): row is Vehicle => Boolean(row)));
    });
  }, [hydrated, savedIds]);

  if (!hydrated) {
    return (
      <div
        className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3"
        aria-busy="true"
        aria-label="Loading saved vehicles"
      >
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="overflow-hidden rounded-2xl border border-border/70 bg-white"
          >
            <div className="aspect-[16/10] animate-pulse bg-muted/60" />
            <div className="space-y-3 p-5">
              <div className="h-5 w-3/4 animate-pulse rounded bg-muted/60" />
              <div className="h-4 w-1/2 animate-pulse rounded bg-muted/50" />
              <div className="h-10 w-full animate-pulse rounded-lg bg-muted/50" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (count === 0 || vehicles.length === 0) {
    return (
      <EmptyState
        icon={Heart}
        title="No saved vehicles yet"
        description="Tap Save on any listing to build your shortlist. Come back here anytime to review or remove cars."
        action={
          <Button asChild variant="gold">
            <Link href={ROUTES.vehicles}>Browse Vehicles</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-baseline justify-between gap-3 border-b border-border/70 pb-4">
        <p className="text-sm font-bold text-primary">
          {count} {count === 1 ? "vehicle" : "vehicles"}
        </p>
        <p className="text-sm text-muted-foreground">Tap the trash icon to remove</p>
      </div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {vehicles.map((vehicle) => (
          <SavedVehicleCard key={vehicle.id} vehicle={vehicle} />
        ))}
      </div>
    </div>
  );
}
