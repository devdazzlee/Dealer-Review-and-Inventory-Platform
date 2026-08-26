"use client";

import { useEffect, useRef, useState, useTransition, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Building2,
  ClipboardCheck,
  Car,
  LayoutGrid,
  ShoppingBag,
  Store,
  Tag,
  Wallet,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { ROUTES } from "@/config/constants";
import { cn } from "@/lib/utils";
import { BlogCardSkeletonGrid } from "@/components/blog/BlogCardSkeleton";
import { NewsletterSignup } from "@/components/blog/NewsletterSignup";

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  "Buying Guides": BookOpen,
  "Dealer Resources": Building2,
  Dealers: Store,
  EVs: Zap,
  Financing: Wallet,
  Inspections: ClipboardCheck,
  Ownership: Car,
  Shopping: ShoppingBag,
};

interface BlogCategoryNavProps {
  categories: { category: string; count: number }[];
  activeCategory?: string;
  total: number;
  children: ReactNode;
}

const MIN_SKELETON_MS = 500;

export function BlogCategoryNav({ categories, activeCategory, total, children }: BlogCategoryNavProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showSkeleton, setShowSkeleton] = useState(false);
  const shownAtRef = useRef<number | null>(null);

  useEffect(() => {
    if (isPending) {
      shownAtRef.current = Date.now();
      setShowSkeleton(true);
      return;
    }
    const elapsed = shownAtRef.current ? Date.now() - shownAtRef.current : MIN_SKELETON_MS;
    const remaining = Math.max(0, MIN_SKELETON_MS - elapsed);
    const timer = setTimeout(() => setShowSkeleton(false), remaining);
    return () => clearTimeout(timer);
  }, [isPending]);

  const navigate = (href: string) => {
    startTransition(() => {
      router.push(href, { scroll: false });
    });
  };

  return (
    <>
      <div className="mb-8 border-b border-border/70 pb-6">
        <p className="mb-3 text-xs font-bold uppercase tracking-wide text-muted-foreground">
          Browse by Topic
        </p>
        <div
          className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:gap-2.5"
          role="tablist"
          aria-label="Filter by category"
        >
          <button
            type="button"
            onClick={() => navigate(ROUTES.blog)}
            role="tab"
            aria-selected={!activeCategory}
            disabled={isPending}
            className={cn(
              "flex items-center justify-between gap-1.5 rounded-xl border px-3 py-2.5 text-xs font-semibold transition-all disabled:cursor-wait sm:inline-flex sm:w-auto sm:justify-start sm:gap-2 sm:rounded-full sm:px-4 sm:text-sm",
              !activeCategory
                ? "border-primary bg-primary text-white shadow-card"
                : "border-border/70 bg-white text-foreground hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary/5 hover:text-primary hover:shadow-card"
            )}
          >
            <span className="flex min-w-0 items-center gap-1.5 sm:gap-2">
              <LayoutGrid className="h-4 w-4 shrink-0" />
              <span className="truncate">All</span>
            </span>
            <span
              className={cn(
                "min-w-[1.5rem] shrink-0 rounded-full px-1.5 py-0.5 text-center text-xs font-bold",
                !activeCategory ? "bg-white/20 text-white" : "bg-secondary text-muted-foreground"
              )}
            >
              {total}
            </span>
          </button>
          {categories.map((item) => {
            const Icon = CATEGORY_ICONS[item.category] ?? Tag;
            const isActive = activeCategory === item.category;
            return (
              <button
                key={item.category}
                type="button"
                onClick={() => navigate(`${ROUTES.blog}?category=${encodeURIComponent(item.category)}`)}
                role="tab"
                aria-selected={isActive}
                disabled={isPending}
                className={cn(
                  "flex items-center justify-between gap-1.5 rounded-xl border px-3 py-2.5 text-xs font-semibold transition-all disabled:cursor-wait sm:inline-flex sm:w-auto sm:justify-start sm:gap-2 sm:rounded-full sm:px-4 sm:text-sm",
                  isActive
                    ? "border-primary bg-primary text-white shadow-card"
                    : "border-border/70 bg-white text-foreground hover:-translate-y-0.5 hover:border-primary/40 hover:bg-primary/5 hover:text-primary hover:shadow-card"
                )}
              >
                <span className="flex min-w-0 items-center gap-1.5 sm:gap-2">
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="truncate">{item.category}</span>
                </span>
                <span
                  className={cn(
                    "min-w-[1.5rem] shrink-0 rounded-full px-1.5 py-0.5 text-center text-xs font-bold",
                    isActive ? "bg-white/20 text-white" : "bg-secondary text-muted-foreground"
                  )}
                >
                  {item.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_280px]" aria-busy={isPending}>
        <div>
          {showSkeleton ? (
            <div className="animate-in fade-in duration-300">
              <BlogCardSkeletonGrid count={9} />
            </div>
          ) : (
            <div className="animate-in fade-in duration-300">{children}</div>
          )}
        </div>
        <aside className="space-y-6">
          <div className="rounded-lg border border-border/70 bg-white p-4 shadow-card">
            <NewsletterSignup />
          </div>
        </aside>
      </div>
    </>
  );
}
