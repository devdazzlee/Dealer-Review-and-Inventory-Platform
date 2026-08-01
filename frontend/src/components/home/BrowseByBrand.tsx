import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { BRAND_PILLS } from "@/config/vehicle";
import { BRAND_LOGOS, brandDisplayName } from "@/config/brand-logos";
import { ROUTES } from "@/config/constants";

export function BrowseByBrand() {
  return (
    <section className="bg-background">
      <div className="container-page py-16 lg:py-20">
        <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-xl">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent-text">
              Popular makes
            </p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-primary sm:text-4xl">
              Browse by brand
            </h2>
            <p className="mt-2 text-muted-foreground">
              Jump into inventory from the makes shoppers search for most.
            </p>
          </div>
          <Link
            href={ROUTES.vehicles}
            prefetch={false}
            className="inline-flex shrink-0 items-center gap-1.5 text-sm font-bold text-primary hover:underline"
          >
            View all vehicles
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          {BRAND_PILLS.map((brand) => (
            <Link
              key={brand}
              href={`${ROUTES.vehicles}?make=${encodeURIComponent(brand)}`}
              prefetch={false}
              className="group flex flex-col items-center gap-3 rounded-2xl border border-border/70 bg-white px-4 py-6 text-center shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-card-hover"
            >
              <span className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-secondary p-2.5">
                <Image
                  src={BRAND_LOGOS[brand]}
                  alt=""
                  width={40}
                  height={40}
                  className="h-9 w-9 object-contain"
                  unoptimized={BRAND_LOGOS[brand].endsWith(".svg")}
                />
              </span>
              <span className="text-sm font-bold text-primary">
                {brandDisplayName(brand)}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
