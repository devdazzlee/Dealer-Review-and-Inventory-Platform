import Link from "next/link";
import { MapPin, Phone, Star, Store } from "lucide-react";
import type { VehicleDealerRef } from "@/types/vehicle";
import { CityPageLink } from "@/components/dealers/CityPageLink";
import { ROUTES } from "@/config/constants";
import { formatPhone } from "@/lib/utils/format";
import { RatingSources } from "@/components/vehicles/RatingBreakdown";
import { StarRating } from "@/components/shared/StarRating";
import { Button } from "@/components/ui/button";

export function VehicleDealerCard({ dealer }: { dealer: VehicleDealerRef }) {
  const digits = dealer.phone.replace(/\D/g, "");

  return (
    <div className="rounded-lg border border-border/70 bg-white p-5 shadow-card">
      <div className="flex items-start gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
          <Store className="h-6 w-6" strokeWidth={1.75} />
        </span>
        <div className="min-w-0">
          <Link
            href={ROUTES.dealerProfile(dealer.slug)}
            className="block truncate text-base font-bold text-primary hover:underline"
          >
            {dealer.name}
          </Link>
          {dealer.featured && (
            <span className="mt-1.5 inline-flex w-fit items-center gap-1 rounded-md bg-accent px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-accent-foreground">
              <Star className="h-3 w-3 fill-current" />
              Featured Dealer
            </span>
          )}
        </div>
      </div>

      <div className="mt-4 rounded-lg bg-secondary/60 p-3.5">
        <div className="flex items-center gap-2">
          <span className="text-2xl font-extrabold text-primary">
            {dealer.ratings.combined != null
              ? dealer.ratings.combined.toFixed(1)
              : "—"}
          </span>
          <div>
            {dealer.ratings.combined != null && (
              <StarRating rating={dealer.ratings.combined} size="sm" />
            )}
            <p className="text-xs text-muted-foreground">
              {dealer.ratings.combined != null
                ? `Combined rating · ${dealer.ratings.totalReviews} reviews`
                : "No rating yet"}
            </p>
          </div>
        </div>
        <div className="mt-3 border-t border-border/70 pt-3">
          <RatingSources ratings={dealer.ratings} showCounts={false} />
        </div>
      </div>

      <div className="mt-4 space-y-2.5 text-sm">
        <p className="flex items-start gap-2 text-muted-foreground">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <CityPageLink city={dealer.city} state={dealer.state} />
        </p>
        <a
          href={`tel:${digits}`}
          className="flex items-center gap-2 font-semibold text-primary hover:underline"
        >
          <Phone className="h-4 w-4 shrink-0" />
          {formatPhone(dealer.phone)}
        </a>
      </div>

      <div className="mt-4 space-y-2">
        <Button asChild className="w-full">
          <Link href={`${ROUTES.vehicles}?query=${encodeURIComponent(dealer.name)}`}>
            View All Inventory
          </Link>
        </Button>
        <Button asChild variant="ghost" size="sm" className="w-full">
          <Link href={ROUTES.dealerProfile(dealer.slug)}>
            View Dealer Profile
          </Link>
        </Button>
      </div>
    </div>
  );
}
