import { Shield, Star, Users } from "lucide-react";

interface ExcellenceBadgeProps {
  dealerName: string;
  year: number;
  combinedRating?: number | null;
}

export function ExcellenceBadge({
  dealerName,
  year,
  combinedRating,
}: ExcellenceBadgeProps) {
  return (
    <div className="overflow-hidden rounded-lg border border-[#d0d7e2] bg-white shadow-[0_2px_12px_rgba(0,0,0,0.08)]">
      <div className="bg-[#003087] px-6 py-5 text-center">
        <p className="text-lg font-extrabold tracking-wide text-[#E8A400]">
          AutoSalesReviews.com
        </p>
        <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/85">
          The Trusted Source for Auto Dealer Reviews
        </p>
      </div>

      <div className="bg-[#003087] px-4 py-4 text-center">
        <p className="text-2xl font-extrabold tracking-wide text-white sm:text-3xl">
          {year} DEALER EXCELLENCE AWARD
        </p>
        <p className="mt-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#E8A400]">
          Recognized for Outstanding Customer Reviews
        </p>
      </div>

      <div className="px-6 py-8 text-center">
        <div className="mb-4 flex justify-center gap-1 text-[#E8A400]">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className="h-8 w-8 fill-current" />
          ))}
        </div>
        {combinedRating != null && (
          <p className="mb-4 text-sm font-semibold text-muted-foreground">
            Combined rating {combinedRating.toFixed(1)} / 5
          </p>
        )}
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#003087]/80">
          Presented to
        </p>
        <p className="mt-2 text-3xl font-extrabold text-[#003087] sm:text-4xl">
          {dealerName}
        </p>

        <div className="mt-8 grid gap-4 border-t border-border/70 pt-6 sm:grid-cols-3">
          <TrustColumn
            icon={Shield}
            title="Verified Reviews"
            text="All reviews are from verified real customers."
          />
          <TrustColumn
            icon={Users}
            title="Real Customers"
            text="Real experiences. Real feedback."
          />
          <TrustColumn
            icon={Star}
            title="Real Feedback"
            text="Helping shoppers make confident decisions."
          />
        </div>
      </div>

      <div className="bg-[#003087] px-4 py-3 text-center text-xs font-bold uppercase tracking-wide text-white">
        Powered by AutoSalesReviews.com
      </div>
    </div>
  );
}

function TrustColumn({
  icon: Icon,
  title,
  text,
}: {
  icon: typeof Shield;
  title: string;
  text: string;
}) {
  return (
    <div className="text-center">
      <Icon className="mx-auto h-6 w-6 text-[#003087]" />
      <p className="mt-2 text-xs font-extrabold uppercase tracking-wide text-[#003087]">
        {title}
      </p>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{text}</p>
    </div>
  );
}
