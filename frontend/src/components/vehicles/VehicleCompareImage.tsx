"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Vehicle } from "@/types/vehicle";
import { bodyStyleIcon } from "@/lib/vehicles/icons";
import { ROUTES } from "@/config/constants";
import { cn } from "@/lib/utils";

type VehicleCompareImageProps = {
  vehicle: Pick<Vehicle, "id" | "make" | "model" | "bodyStyle" | "accent" | "photos">;
  /** Passed to next/image so it requests a source matching the column's
   * actual (flexible) rendered width instead of a guessed fixed value. */
  sizes: string;
};

export function VehicleCompareImage({
  vehicle,
  sizes,
}: VehicleCompareImageProps) {
  const images = vehicle.photos ?? [];
  const [activeIndex, setActiveIndex] = useState(0);
  const hasMultiple = images.length > 1;
  const Icon = bodyStyleIcon(vehicle.bodyStyle);
  const alt = `${vehicle.make} ${vehicle.model}`;

  function goPrev(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    setActiveIndex((i) => (i === 0 ? images.length - 1 : i - 1));
  }

  function goNext(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    setActiveIndex((i) => (i === images.length - 1 ? 0 : i + 1));
  }

  return (
    <Link
      href={ROUTES.vehicleDetail(vehicle.id)}
      className="group/photo relative block aspect-[8/5] w-full overflow-hidden rounded-lg bg-photo-placeholder"
    >
      {images.length > 0 ? (
        <Image
          key={images[activeIndex]}
          src={images[activeIndex]}
          alt={`${alt} — photo ${activeIndex + 1} of ${images.length}`}
          fill
          sizes={sizes}
          // Comparisons only ever show 2-4 vehicles, all above the fold —
          // lazy-loading would just add a pointless placeholder flash.
          priority
          className="object-cover"
        />
      ) : (
        <div className="relative flex h-full w-full items-center justify-center">
          <div
            className="absolute inset-0 opacity-[0.12]"
            style={{
              background: `radial-gradient(circle at 50% 45%, ${vehicle.accent} 0%, transparent 62%)`,
            }}
            aria-hidden
          />
          <Icon
            className="relative h-12 w-12 text-slate-400/80"
            strokeWidth={1.25}
            aria-hidden
          />
        </div>
      )}

      {hasMultiple && (
        <>
          <button
            type="button"
            onClick={goPrev}
            aria-label="Previous photo"
            className="absolute left-1.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition-opacity hover:bg-black/70 focus-visible:opacity-100 group-hover/photo:opacity-100"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={goNext}
            aria-label="Next photo"
            className="absolute right-1.5 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition-opacity hover:bg-black/70 focus-visible:opacity-100 group-hover/photo:opacity-100"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          <div className="absolute inset-x-0 bottom-1.5 flex items-center justify-center gap-1">
            {images.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={(event) => {
                  event.preventDefault();
                  event.stopPropagation();
                  setActiveIndex(index);
                }}
                aria-label={`View photo ${index + 1} of ${images.length}`}
                aria-current={index === activeIndex ? "true" : undefined}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  index === activeIndex
                    ? "w-3.5 bg-white"
                    : "w-1.5 bg-white/50 hover:bg-white/80"
                )}
              />
            ))}
          </div>
        </>
      )}
    </Link>
  );
}
