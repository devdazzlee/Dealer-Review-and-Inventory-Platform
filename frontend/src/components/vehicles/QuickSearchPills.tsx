import Link from "next/link";
import { QUICK_SEARCH_PILLS } from "@/config/vehicle";
import { cn } from "@/lib/utils";

const FILTER_LABELS = new Set(["SUVs", "Under $15K", "Electric"]);

export function QuickSearchPills({
  variant = "hero",
  align = "center",
}: {
  variant?: "hero" | "light";
  align?: "left" | "center";
}) {
  const isHero = variant === "hero";
  const brands = QUICK_SEARCH_PILLS.filter((p) => !FILTER_LABELS.has(p.label));
  const filters = QUICK_SEARCH_PILLS.filter((p) => FILTER_LABELS.has(p.label));

  return (
    <div
      className={cn(
        "flex w-full",
        align === "center" ? "justify-center" : "justify-start"
      )}
    >
      <div className="inline-flex max-w-full items-center gap-3">
        <span
          className={cn(
            "shrink-0 text-[11px] font-semibold uppercase tracking-[0.16em]",
            isHero ? "text-white/50" : "text-muted-foreground"
          )}
        >
          Popular
        </span>

        <div className="flex min-w-0 items-center gap-2 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {brands.map((pill) => (
            <Link
              key={pill.label}
              href={pill.href}
              prefetch={false}
              className={cn(
                "shrink-0 rounded-md px-3 py-1.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2",
                isHero
                  ? "bg-white text-primary hover:bg-accent hover:text-accent-foreground focus-visible:ring-offset-[hsl(var(--primary))]"
                  : "border border-border bg-white text-primary hover:border-primary hover:bg-primary hover:text-primary-foreground"
              )}
            >
              {pill.label}
            </Link>
          ))}

          {filters.length > 0 && (
            <>
              <span
                aria-hidden
                className={cn(
                  "mx-0.5 h-4 w-px shrink-0",
                  isHero ? "bg-white/25" : "bg-border"
                )}
              />
              {filters.map((pill) => (
                <Link
                  key={pill.label}
                  href={pill.href}
                  prefetch={false}
                  className={cn(
                    "shrink-0 rounded-md px-3 py-1.5 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2",
                    isHero
                      ? "border border-accent/50 bg-accent/15 text-accent hover:border-accent hover:bg-accent hover:text-accent-foreground focus-visible:ring-offset-[hsl(var(--primary))]"
                      : "border border-accent/40 bg-accent/10 text-accent-foreground hover:border-accent hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  {pill.label}
                </Link>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
