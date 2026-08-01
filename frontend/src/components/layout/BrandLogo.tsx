import Link from "next/link";
import { Car } from "lucide-react";
import { SITE, ROUTES } from "@/config/constants";
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  className?: string;
  variant?: "default" | "dark";
}

export function BrandLogo({ className, variant = "default" }: BrandLogoProps) {
  const isDark = variant === "dark";
  return (
    <Link
      href={ROUTES.home}
      className={cn(
        "group flex min-w-0 items-center gap-2.5 overflow-visible",
        className
      )}
      aria-label={SITE.name}
    >
      <span
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
          isDark ? "bg-white" : "bg-primary"
        )}
      >
        <Car
          className={cn("h-5 w-5", isDark ? "text-primary" : "text-white")}
          strokeWidth={2.25}
          aria-hidden
        />
      </span>
      <span
        className={cn(
          "truncate text-lg font-extrabold tracking-tight",
          isDark ? "text-white" : "text-primary"
        )}
      >
        AutoSales
        <span className={isDark ? "text-accent" : "text-gold-800"}>Reviews</span>
      </span>
    </Link>
  );
}
