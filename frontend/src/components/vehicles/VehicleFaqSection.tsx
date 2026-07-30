import { Plus } from "lucide-react";
import type { FaqItem } from "@/lib/schema/types";

interface VehicleFaqSectionProps {
  items: FaqItem[];
  title?: string;
}

/**
 * Product-page FAQ accordion. Uses native <details> for progressive enhancement
 * and a + / × toggle that matches the PDP design.
 */
export function VehicleFaqSection({
  items,
  title = "Frequently Asked Questions",
}: VehicleFaqSectionProps) {
  if (items.length === 0) return null;

  return (
    <section
      className="border-t border-border/70 bg-white py-10 lg:py-12"
      aria-labelledby="vehicle-faq-heading"
    >
      <div className="container-page">
        <div className="mx-auto max-w-3xl">
          <header className="mb-6">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-accent-text">
              Buyer help
            </p>
            <h2
              id="vehicle-faq-heading"
              className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl"
            >
              {title}
            </h2>
            <div className="mt-3 h-1 w-12 rounded-full bg-accent" aria-hidden />
          </header>

          <div className="divide-y divide-border/70 rounded-xl border border-border/70 bg-secondary/30 px-4 sm:px-5">
            {items.map((item) => (
              <details key={item.question} className="group py-0.5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-left marker:content-none [&::-webkit-details-marker]:hidden">
                  <span className="text-base font-semibold text-foreground">
                    {item.question}
                  </span>
                  <Plus
                    className="h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-45 group-open:text-foreground"
                    aria-hidden
                  />
                </summary>
                <p className="pb-4 pr-10 text-sm leading-relaxed text-muted-foreground sm:text-base">
                  {item.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
