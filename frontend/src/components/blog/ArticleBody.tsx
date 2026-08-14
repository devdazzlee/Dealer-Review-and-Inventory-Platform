import Link from "next/link";
import { ChevronDown } from "lucide-react";
import type { ArticleBlock, InlinePart } from "@/config/blog";
import { slugifyHeading } from "@/lib/blog/toc";

function renderInline(parts: InlinePart[], keyPrefix: string) {
  return parts.map((part, index) => {
    if (typeof part === "string") {
      return <span key={`${keyPrefix}-${index}`}>{part}</span>;
    }
    return (
      <Link
        key={`${keyPrefix}-${index}`}
        href={part.href}
        className="font-semibold text-primary underline-offset-2 hover:underline"
      >
        {part.link}
      </Link>
    );
  });
}

export function ArticleBody({ blocks }: { blocks: ArticleBlock[] }) {
  return (
    <div className="space-y-5">
      {blocks.map((block, i) => {
        switch (block.type) {
          case "h2":
            return (
              <h2
                key={i}
                id={slugifyHeading(block.text)}
                className="scroll-mt-24 pt-3 text-xl font-bold text-primary sm:text-2xl"
              >
                {block.text}
              </h2>
            );
          case "h3":
            return (
              <h3
                key={i}
                className="pt-1 text-lg font-semibold text-foreground"
              >
                {block.text}
              </h3>
            );
          case "p":
            return (
              <p
                key={i}
                className="text-base leading-relaxed text-foreground/90"
              >
                {renderInline(block.parts, `p-${i}`)}
              </p>
            );
          case "ul":
            return (
              <ul key={i} className="space-y-2.5">
                {block.items.map((item, j) => (
                  <li key={j} className="flex items-start gap-2.5">
                    <span
                      className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent"
                      aria-hidden
                    />
                    <span className="text-base leading-relaxed text-foreground/90">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            );
          case "quote":
            return (
              <blockquote
                key={i}
                className="relative rounded-lg border-l-4 border-accent bg-secondary/60 p-5 pl-6"
              >
                <p className="text-lg font-semibold italic text-primary">
                  &ldquo;{block.text}&rdquo;
                </p>
              </blockquote>
            );
          case "faq":
            return (
              <section key={i} aria-labelledby={`faq-heading-${i}`}>
                <h2
                  id={`faq-heading-${i}`}
                  className="pt-3 text-xl font-bold text-primary sm:text-2xl"
                >
                  {block.title ?? "Frequently Asked Questions"}
                </h2>
                <div className="mt-4 divide-y divide-border/70 rounded-lg border border-border/70 bg-white">
                  {block.items.map((item, j) => (
                    <details key={j} className="group px-5 py-4">
                      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-base font-semibold text-primary marker:content-none">
                        {item.question}
                        <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
                      </summary>
                      <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                        {item.answer}
                      </p>
                    </details>
                  ))}
                </div>
              </section>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}
