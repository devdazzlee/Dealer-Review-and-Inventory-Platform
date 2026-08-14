import { Star } from "lucide-react";
import type { DealerRatings } from "@/types/vehicle";
import { StarRating } from "@/components/shared/StarRating";
import { cn } from "@/lib/utils";

function Source({
  label,
  value,
  count,
}: {
  label: string;
  value: number;
  count?: number | null;
}) {
  return (
    <div className="flex items-center gap-1.5 text-sm">
      <span className="font-semibold text-foreground">{label}</span>
      <Star className="h-3.5 w-3.5 fill-accent text-accent" />
      <span className="font-bold text-primary">{value.toFixed(1)}</span>
        {count != null && count > 0 && (
        <span className="text-xs text-muted-foreground">
          ({count} {count === 1 ? "review" : "reviews"})
        </span>
      )}
    </div>
  );
}

function sourcesToShow(ratings: DealerRatings) {
  if (ratings.sources?.length) {
    return ratings.sources
      .filter((s) => s.included && s.rating != null)
      .map((s) => ({
        label: s.label,
        value: s.rating as number,
        count: s.reviewCount,
      }));
  }

  const fallback: { label: string; value: number; count?: number | null }[] = [];
  if (ratings.google != null)
    fallback.push({
      label: "Google",
      value: ratings.google,
      count: ratings.googleCount,
    });
  if (ratings.yelp != null)
    fallback.push({
      label: "Yelp",
      value: ratings.yelp,
      count: ratings.yelpCount,
    });
  if (ratings.carfax != null)
    fallback.push({ label: "Carfax", value: ratings.carfax });
  if (ratings.autoSalesReviews != null)
    fallback.push({
      label: "AutoSalesReviews",
      value: ratings.autoSalesReviews,
    });
  if (ratings.platform != null)
    fallback.push({
      label: "Platform",
      value: ratings.platform,
      count: ratings.platformCount,
    });
  return fallback;
}

/** Inline row of enabled rating sources with values. */
export function RatingSources({
  ratings,
  showCounts = true,
  className,
}: {
  ratings: DealerRatings;
  showCounts?: boolean;
  className?: string;
}) {
  const items = sourcesToShow(ratings);
  if (items.length === 0) return null;

  return (
    <div
      className={cn(
        "flex flex-wrap items-center gap-x-4 gap-y-2",
        className
      )}
    >
      {items.map((item, index) => (
        <div key={item.label} className="flex items-center gap-x-4">
          {index > 0 && (
            <span
              className="hidden h-4 w-px bg-border sm:inline-block"
              aria-hidden
            />
          )}
          <Source
            label={item.label}
            value={item.value}
            count={showCounts ? item.count : undefined}
          />
        </div>
      ))}
    </div>
  );
}

/** Full breakdown card with combined average + individual sources. */
export function RatingBreakdown({
  ratings,
  className,
}: {
  ratings: DealerRatings;
  className?: string;
}) {
  const combined = ratings.combined;

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center gap-3">
        <span className="text-3xl font-extrabold text-primary">
          {combined != null ? combined.toFixed(1) : "—"}
        </span>
        <div>
          {combined != null && <StarRating rating={combined} size="md" />}
          <p className="mt-0.5 text-xs text-muted-foreground">
            {combined != null
              ? `Combined average · ${ratings.totalReviews} reviews`
              : "No rating yet"}
          </p>
        </div>
      </div>
      <RatingSources ratings={ratings} />
    </div>
  );
}
