import Link from "next/link";
import { Car, MapPin, Phone, Star, Store } from "lucide-react";
import type { DealerCardData } from "@/lib/dealers/enrich";
import { CityPageLink } from "@/components/dealers/CityPageLink";
import { ROUTES } from "@/config/constants";
import { formatPhone } from "@/lib/utils/format";
import { RatingSources } from "@/components/vehicles/RatingBreakdown";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface DealerListCardProps {
  dealer: DealerCardData;
  compact?: boolean;
}

export function DealerListCard({ dealer, compact = false }: DealerListCardProps) {
  const profileHref = ROUTES.dealerProfile(dealer.slug);
  const inventoryHref = `${ROUTES.vehicles}?query=${encodeURIComponent(
    dealer.name
  )}`;

  return (
    <article
      className={cn(
        "group flex flex-col gap-4 rounded-lg border bg-card p-4 shadow-card transition-all duration-300 hover:shadow-card-hover sm:flex-row sm:items-center sm:p-5",
        dealer.featured
          ? "border-l-4 border-l-accent border-y-border/70 border-r-border/70"
          : "border-border/70"
      )}
    >
      <div className="flex items-center gap-4 sm:flex-1">
        <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-secondary text-primary">
          <Store className="h-7 w-7" strokeWidth={1.75} />
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={profileHref}
              className="text-lg font-bold text-primary hover:underline"
            >
              {dealer.name}
            </Link>
            {dealer.featured && (
              <span className="inline-flex items-center gap-1 rounded-md bg-accent px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-accent-foreground">
                <Star className="h-3 w-3 fill-current" />
                Featured
              </span>
            )}
          </div>
          <p className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            <CityPageLink
              city={dealer.city}
              state={dealer.state}
              className="text-muted-foreground hover:text-primary"
            />
          </p>

          <div className="mt-2 flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-md bg-gold-light px-2 py-0.5 text-sm font-bold text-amber-800">
              <Star className="h-3.5 w-3.5 fill-gold-600 text-gold-600" />
              {dealer.ratings.combined != null
                ? dealer.ratings.combined.toFixed(1)
                : "—"}
            </span>
            {!compact && (
              <span className="hidden text-xs text-muted-foreground sm:inline">
                Combined · {dealer.ratings.totalReviews} reviews
              </span>
            )}
          </div>

          {!compact && (
            <div className="mt-2">
              <RatingSources ratings={dealer.ratings} showCounts={false} />
            </div>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1 font-semibold text-primary">
              <Car className="h-3.5 w-3.5" />
              {dealer.vehicleCount} vehicles
            </span>
            {dealer.phone && (
              <span className="flex items-center gap-1">
                <Phone className="h-3.5 w-3.5" />
                {formatPhone(dealer.phone)}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex shrink-0 flex-col gap-2 sm:w-44">
        <Button asChild className="w-full">
          <Link href={profileHref}>View Profile</Link>
        </Button>
        <Button asChild variant="ghost" size="sm" className="w-full">
          <Link href={inventoryHref}>Browse Inventory</Link>
        </Button>
      </div>
    </article>
  );
}
