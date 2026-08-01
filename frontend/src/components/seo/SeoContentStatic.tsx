import Link from "next/link";
import { cn } from "@/lib/utils";
import type { SeoBlock, SeoContent, SeoInline } from "@/config/seo-content";

function renderInline(parts: SeoInline[], keyPrefix: string) {
  return parts.map((part, index) => {
    if (typeof part === "string") {
      return <span key={`${keyPrefix}-${index}`}>{part}</span>;
    }

    return (
      <Link
        key={`${keyPrefix}-${index}`}
        href={part.href}
        prefetch={false}
        className="font-semibold text-primary underline-offset-2 hover:underline"
      >
        {part.text}
      </Link>
    );
  });
}

export function SeoBlockRenderer({
  block,
  index,
}: {
  block: SeoBlock;
  index: number;
}) {
  const key = `seo-block-${index}`;

  if (block.type === "h2") {
    return (
      <h2
        key={key}
        className="mt-8 text-2xl font-bold tracking-tight text-foreground first:mt-0"
      >
        {renderInline(block.content, key)}
      </h2>
    );
  }

  if (block.type === "h3") {
    return (
      <h3 key={key} className="mt-6 text-lg font-semibold text-foreground/90">
        {renderInline(block.content, key)}
      </h3>
    );
  }

  return (
    <p
      key={key}
      className="mt-3 text-base leading-relaxed text-muted-foreground"
    >
      {renderInline(block.content, key)}
    </p>
  );
}

/**
 * Server-only SEO copy — no hydration / ResizeObserver. Use on long pages
 * (e.g. homepage) where a client "Read more" toggle isn’t worth the TBT.
 */
export function SeoContentStatic({
  content,
  className,
  variant = "default",
  wide = false,
}: {
  content: SeoContent;
  className?: string;
  variant?: "default" | "muted" | "compact";
  wide?: boolean;
}) {
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
        <div className={cn(!wide && "mx-auto max-w-3xl")}>
          {content.blocks.map((block, index) => (
            <SeoBlockRenderer key={index} block={block} index={index} />
          ))}
        </div>
      </div>
    </section>
  );
}
