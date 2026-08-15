import Link from "next/link";
import {
  ChevronRight,
  Globe,
  MapPin,
  PenSquare,
  Phone,
  Star,
} from "lucide-react";
import type { DealerDetail } from "@/types/dealer";
import type { DealerRatings } from "@/types/vehicle";
import { CityPageLink } from "@/components/dealers/CityPageLink";
import { ROUTES } from "@/config/constants";
import { formatPhone, stripProtocol } from "@/lib/utils/format";
import { StarRating } from "@/components/shared/StarRating";
import { RatingSources } from "@/components/vehicles/RatingBreakdown";
import { Button } from "@/components/ui/button";

export function DealerProfileHero({
  dealer,
  ratings,
}: {
  dealer: DealerDetail;
  ratings: DealerRatings;
}) {
  return (
    <div className="rounded-lg border border-border/70 bg-white p-5 shadow-card sm:p-6">
      <nav
        className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground"
        aria-label="Breadcrumb"
      >
        <Link href={ROUTES.home} className="hover:text-primary">
          Home
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href={ROUTES.dealers} className="hover:text-primary">
          Dealers
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="font-medium text-primary">{dealer.name}</span>
      </nav>

      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-extrabold text-primary sm:text-3xl">
              {dealer.name}
            </h1>
            {dealer.featured && (
              <span className="inline-flex items-center gap-1 rounded-md bg-accent px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-accent-foreground">
                <Star className="h-3.5 w-3.5 fill-current" />
                Featured Dealer
              </span>
            )}
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-primary" />
              {dealer.address ? `${dealer.address}, ` : ""}
              <CityPageLink
                city={dealer.city}
                state={dealer.state}
                cityOnly
                className="text-muted-foreground hover:text-primary"
              />
              , {dealer.state} {dealer.zip}
            </span>
            {dealer.phone && (
              <a
                href={`tel:${dealer.phone.replace(/\D/g, "")}`}
                className="flex items-center gap-1.5 hover:text-primary"
              >
                <Phone className="h-4 w-4 text-primary" />
                {formatPhone(dealer.phone)}
              </a>
            )}
            {dealer.website && (
              <a
                href={dealer.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 hover:text-primary"
              >
                <Globe className="h-4 w-4 text-primary" />
                {stripProtocol(dealer.website)}
              </a>
            )}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="text-3xl font-extrabold text-primary">
              {ratings.combined != null ? ratings.combined.toFixed(1) : "—"}
            </span>
            <div>
              {ratings.combined != null && (
                <StarRating rating={ratings.combined} size="md" />
              )}
              <p className="text-xs text-muted-foreground">
                {ratings.combined != null
                  ? `Combined average · ${ratings.totalReviews} reviews`
                  : "No rating yet"}
              </p>
            </div>
          </div>
          <div className="mt-3">
            <RatingSources ratings={ratings} />
          </div>
        </div>

        <div className="flex shrink-0 flex-col gap-2.5 sm:flex-row lg:flex-col lg:w-52">
          <Button asChild variant="gold" className="w-full">
            <a href="#write-review">
              <PenSquare className="h-4 w-4" />
              Write a Review
            </a>
          </Button>
          {dealer.website && (
            <Button asChild variant="outline" className="w-full">
              <a href={dealer.website} target="_blank" rel="noopener noreferrer">
                <Globe className="h-4 w-4" />
                Visit Website
              </a>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
