import Image from "next/image";
import { ImageIcon } from "lucide-react";
import type { Vehicle } from "@/types/vehicle";
import { bodyStyleIcon } from "@/lib/vehicles/icons";
import { cn } from "@/lib/utils";

/** Default 16:10 aspect ratio for card and list thumbnails. */
export const VEHICLE_PHOTO_WIDTH = 640;
export const VEHICLE_PHOTO_HEIGHT = 400;

interface VehiclePhotoProps {
  vehicle: Pick<
    Vehicle,
    "id" | "bodyStyle" | "accent" | "photoCount" | "make" | "model" | "year" | "photos"
  >;
  className?: string;
  showCount?: boolean;
  iconClassName?: string;
  /** Override the resolved image (used by the gallery for a specific photo). */
  image?: string;
  /** Intrinsic dimensions, prevents layout shift and drives srcset. */
  width?: number;
  height?: number;
  /** Passed to next/image for responsive sizing. */
  sizes?: string;
  priority?: boolean;
  quality?: number;
}

function isServablePhoto(url: string): boolean {
  const lower = url.toLowerCase();
  return Boolean(url) && !lower.includes("auto.dev") && !lower.includes("photos.vin");
}

/**
 * Renders the real vehicle photo when available, otherwise a gray gradient
 * placeholder with a body-style car icon. Includes an optional photo-count badge.
 */
export function VehiclePhoto({
  vehicle,
  className,
  showCount = true,
  iconClassName,
  image,
  width = VEHICLE_PHOTO_WIDTH,
  height = VEHICLE_PHOTO_HEIGHT,
  sizes = "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px",
  priority = false,
  quality = 75,
}: VehiclePhotoProps) {
  const images = (vehicle.photos ?? []).filter(isServablePhoto);
  const src = image && isServablePhoto(image) ? image : images[0];
  const Icon = bodyStyleIcon(vehicle.bodyStyle);
  const count = images.length || vehicle.photoCount;
  const alt = `${vehicle.year ? `${vehicle.year} ` : ""}${vehicle.make} ${vehicle.model}`.trim();

  return (
    <div
      className={cn(
        "relative flex items-center justify-center overflow-hidden bg-photo-placeholder",
        className
      )}
      style={{ aspectRatio: `${width} / ${height}` }}
    >
      {src ? (
        <Image
          key={src}
          src={src}
          alt={alt}
          width={width}
          height={height}
          sizes={sizes}
          quality={quality}
          priority={priority}
          loading={priority ? undefined : "lazy"}
          className="h-full w-full object-cover"
        />
      ) : (
        <>
          <div
            className="absolute inset-0 opacity-[0.12]"
            style={{
              background: `radial-gradient(circle at 50% 45%, ${vehicle.accent} 0%, transparent 62%)`,
            }}
            aria-hidden
          />
          <Icon
            className={cn("relative h-16 w-16 text-slate-400/80", iconClassName)}
            strokeWidth={1.25}
            aria-hidden
          />
        </>
      )}

      {showCount && (
        <span className="absolute bottom-2.5 right-2.5 inline-flex items-center gap-1 rounded-md bg-black/55 px-2 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
          <ImageIcon className="h-3 w-3" />
          {count}
        </span>
      )}
    </div>
  );
}
