"use client";

import { useEffect, useState, type ComponentType } from "react";
import Link from "next/link";
import { ChevronDown, MapPin } from "lucide-react";
import { ROUTES } from "@/config/constants";
import { cn } from "@/lib/utils";

interface CitiesNavDropdownProps {
  isActive: boolean;
  onNavigate?: () => void;
  variant?: "desktop" | "mobile";
}

function CitiesNavFallback({
  isActive,
  onNavigate,
  variant = "desktop",
}: CitiesNavDropdownProps) {
  const triggerClass = cn(
    "inline-flex items-center gap-1 whitespace-nowrap rounded-md text-sm font-semibold transition-colors",
    variant === "desktop"
      ? "px-3.5 py-2"
      : "w-full justify-between rounded-lg px-4 py-3.5 text-base",
    isActive
      ? "bg-secondary text-primary"
      : variant === "desktop"
        ? "text-slate-600 hover:bg-secondary hover:text-primary"
        : "text-slate-700 hover:bg-secondary"
  );

  return (
    <Link
      href={ROUTES.cities}
      onClick={onNavigate}
      className={triggerClass}
      aria-label="Cities we serve"
    >
      {variant === "mobile" ? (
        <span className="inline-flex items-center gap-1.5">
          <MapPin className="h-4 w-4" />
          Cities
        </span>
      ) : (
        "Cities"
      )}
      <ChevronDown className="h-4 w-4 opacity-70" />
    </Link>
  );
}

/**
 * Defers Radix DropdownMenu until after hydration so it stays off the
 * homepage critical JS path. Fallback is a same-sized Cities link.
 */
export function CitiesNavDropdownLazy(props: CitiesNavDropdownProps) {
  const [Dropdown, setDropdown] = useState<ComponentType<CitiesNavDropdownProps> | null>(
    null
  );

  useEffect(() => {
    let cancelled = false;
    const start = () => {
      void import("@/components/layout/CitiesNavDropdown").then((m) => {
        if (!cancelled) setDropdown(() => m.CitiesNavDropdown);
      });
    };

    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(start, { timeout: 2500 });
      return () => {
        cancelled = true;
        window.cancelIdleCallback(id);
      };
    }

    const timer = window.setTimeout(start, 1);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, []);

  if (!Dropdown) return <CitiesNavFallback {...props} />;
  return <Dropdown {...props} />;
}
