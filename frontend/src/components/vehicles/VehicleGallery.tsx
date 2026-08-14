"use client";

import { useState } from "react";
import Image from "next/image";
import { Camera, Expand } from "lucide-react";
import type { Vehicle } from "@/types/vehicle";
import { VehiclePhoto } from "@/components/vehicles/VehiclePhoto";
import { VehicleImageLightbox } from "@/components/vehicles/VehicleImageLightbox";
import { ConditionBadge } from "@/components/vehicles/ConditionBadge";
import { cn } from "@/lib/utils";

const TINT_SHIFTS = ["#33517a", "#3d6187", "#2f6b7a", "#5a4a7a", "#6b5535"];

export function VehicleGallery({ vehicle }: { vehicle: Vehicle }) {
  const [active, setActive] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const images = vehicle.photos ?? [];
  const hasImages = images.length > 0;
  const total = hasImages ? images.length : vehicle.photoCount;
  const vehicleLabel = `${vehicle.year} ${vehicle.make} ${vehicle.model}`;
  const activeSrc = hasImages ? images[active] : undefined;

  function openLightbox(index?: number) {
    if (!hasImages) return;
    if (index !== undefined) setActive(index);
    setLightboxOpen(true);
  }

  return (
    <div>
      <div className="relative overflow-hidden rounded-lg border border-border/70 shadow-card">
        {hasImages && activeSrc ? (
          <button
            type="button"
            onClick={() => openLightbox(active)}
            className="group relative block w-full cursor-zoom-in text-left"
            aria-label={`View full-size photos of ${vehicleLabel}`}
          >
            <div className="relative aspect-[8/5] w-full bg-photo-placeholder">
              <Image
                key={activeSrc}
                src={activeSrc}
                alt={vehicleLabel}
                fill
                sizes="(max-width: 1024px) 100vw, 800px"
                className="object-cover transition-opacity group-hover:opacity-95"
                priority={active === 0}
              />
            </div>
            <span
              className="pointer-events-none absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/10"
              aria-hidden
            />
          </button>
        ) : (
          <VehiclePhoto
            vehicle={{ ...vehicle, accent: TINT_SHIFTS[active] }}
            className="w-full"
            width={800}
            height={500}
            showCount={false}
            iconClassName="h-24 w-24"
            sizes="(max-width: 1024px) 100vw, 800px"
            priority
          />
        )}

        <div className="pointer-events-none absolute left-4 top-4 z-10">
          <ConditionBadge condition={vehicle.condition} className="text-sm" />
        </div>

        {hasImages && (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              openLightbox(active);
            }}
            className="absolute right-4 top-4 z-10 inline-flex h-10 w-10 items-center justify-center rounded-md bg-black/55 text-white backdrop-blur-sm transition-colors hover:bg-black/70"
            aria-label="Open photo gallery"
          >
            <Expand className="h-5 w-5" />
          </button>
        )}

        {hasImages && (
          <span className="pointer-events-none absolute bottom-4 right-4 z-10 inline-flex items-center gap-1.5 rounded-md bg-black/55 px-2.5 py-1.5 text-xs font-semibold text-white backdrop-blur-sm">
            <Camera className="h-3.5 w-3.5" />
            {images.length === 1 ? "1 photo" : `${active + 1} / ${total}`}
          </span>
        )}
      </div>

      {hasImages && images.length > 1 ? (
        <div className="mt-3 grid grid-cols-5 gap-2.5">
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              onClick={() => setActive(i)}
              aria-label={`View photo ${i + 1}`}
              aria-current={active === i ? "true" : undefined}
              className={cn(
                "overflow-hidden rounded-md border-2 transition-colors",
                active === i
                  ? "border-primary"
                  : "border-transparent hover:border-primary/40"
              )}
            >
              <div className="relative aspect-[4/3] w-full bg-photo-placeholder">
                <Image
                  src={src}
                  alt={`${vehicleLabel} — photo ${i + 1}`}
                  fill
                  sizes="150px"
                  className="object-cover"
                />
              </div>
            </button>
          ))}
        </div>
      ) : null}

      {hasImages && (
        <VehicleImageLightbox
          open={lightboxOpen}
          images={images}
          activeIndex={active}
          alt={vehicleLabel}
          onClose={() => setLightboxOpen(false)}
          onNavigate={setActive}
        />
      )}
    </div>
  );
}
