"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SeoContent } from "@/config/seo-content";
import { SeoBlockRenderer } from "@/components/seo/SeoContentStatic";

interface SeoContentSectionProps {
  content: SeoContent;
  className?: string;
  variant?: "default" | "muted" | "compact";
  /** When true, content spans full listing width instead of a narrow column. */
  wide?: boolean;
  /** When true, omits outer container padding for nesting inside an existing layout. */
  embedded?: boolean;
  /**
   * When true (default), content that overflows the collapsed height hides
   * behind a "Read more" toggle. Only pass false for short blurbs placed
   * above the fold (e.g. an intro blurb near a page's hero) — the bottom-of-page
   * SEO block on a given page should keep this on.
   */
  collapsible?: boolean;
}

// Intentionally short: this is how much shows before truncation, so the
// "Read more" toggle always reveals a real chunk of hidden copy rather than
// a line or two.
const COLLAPSED_HEIGHT_PX = 170;
// Buffer so we don't show a toggle for content that's only a few px taller
// than the collapsed box (nothing meaningful would be hidden).
const OVERFLOW_BUFFER_PX = 40;

const FADE_BY_VARIANT: Record<
  NonNullable<SeoContentSectionProps["variant"]>,
  string
> = {
  default: "from-background",
  muted: "from-muted/70",
  compact: "from-background",
};

export function SeoContentSection({
  content,
  className,
  variant = "default",
  wide = false,
  embedded = false,
  collapsible = true,
}: SeoContentSectionProps) {
  const [expanded, setExpanded] = useState(false);
  // null = not measured yet. We only know whether there's enough hidden
  // content to justify a toggle after the browser lays out the real text,
  // so the button never appears unless it actually reveals something.
  const [overflows, setOverflows] = useState<boolean | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!collapsible) {
      setOverflows(false);
      return;
    }
    const el = contentRef.current;
    if (!el) return;

    // ResizeObserver measures after the browser has already computed layout,
    // so reading scrollHeight here doesn't force a synchronous reflow the
    // way doing it in a layout effect right after a DOM write would.
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      setOverflows(
        entry.target.scrollHeight > COLLAPSED_HEIGHT_PX + OVERFLOW_BUFFER_PX
      );
    });
    observer.observe(el);

    return () => observer.disconnect();
    // Re-measure if the actual content passed in changes (e.g. dynamic
    // per-dealer / per-vehicle copy of a different length).
  }, [collapsible, content]);

  const canCollapse = overflows === true;
  const collapsed = canCollapse && !expanded;

  const inner = (
    <div className={cn(!wide && "mx-auto max-w-3xl")}>
      <div
        ref={contentRef}
        className={cn("relative", collapsed && "overflow-hidden")}
        style={collapsed ? { maxHeight: COLLAPSED_HEIGHT_PX } : undefined}
      >
        {content.blocks.map((block, index) => (
          <SeoBlockRenderer key={index} block={block} index={index} />
        ))}
        {collapsed && (
          <div
            aria-hidden
            className={cn(
              "pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t to-transparent",
              FADE_BY_VARIANT[variant]
            )}
          />
        )}
      </div>
      {canCollapse && (
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          aria-expanded={expanded}
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
        >
          {expanded ? "Show less" : "Read more"}
          <ChevronDown
            className={cn(
              "h-4 w-4 transition-transform",
              expanded && "rotate-180"
            )}
          />
        </button>
      )}
    </div>
  );

  if (embedded) {
    return (
      <section
        className={cn(
          variant === "muted" && "border-y border-border/70 bg-muted/30",
          variant === "compact" && "border-t border-border/70",
          "mb-6",
          className
        )}
        aria-label="Additional information"
      >
        {inner}
      </section>
    );
  }

  return (
    <section
      className={cn(
        variant === "muted" && "border-y border-border/70 bg-muted/30",
        variant === "compact" && "border-t border-border/70",
        className
      )}
      aria-label="Additional information"
    >
      <div
        className={cn(
          "container-page",
          variant === "compact" ? "py-6 lg:py-8" : "py-10 lg:py-12"
        )}
      >
        {inner}
      </div>
    </section>
  );
}
