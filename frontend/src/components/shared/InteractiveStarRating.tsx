"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface InteractiveStarRatingProps {
  value: number;
  onChange: (value: number) => void;
  size?: "md" | "lg" | "xl";
  label?: string;
  required?: boolean;
  id?: string;
  error?: string;
}

const sizeClasses = {
  md: "h-6 w-6",
  lg: "h-8 w-8",
  xl: "h-10 w-10",
} as const;

export function InteractiveStarRating({
  value,
  onChange,
  size = "lg",
  label,
  required,
  id,
  error,
}: InteractiveStarRatingProps) {
  return (
    <div>
      {label && (
        <p className="mb-2 text-sm font-semibold text-foreground">
          {label}
          {required && <span className="text-destructive"> *</span>}
        </p>
      )}
      <div
        id={id}
        className="flex items-center gap-1"
        role="radiogroup"
        aria-label={label ?? "Rating"}
      >
        {[1, 2, 3, 4, 5].map((star) => {
          const filled = star <= value;
          return (
            <button
              key={star}
              type="button"
              role="radio"
              aria-checked={value === star}
              aria-label={`${star} star${star === 1 ? "" : "s"}`}
              onClick={() => onChange(star)}
              className={cn(
                "rounded-md p-0.5 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                filled ? "text-accent" : "text-muted-foreground/30"
              )}
            >
              <Star
                className={cn(sizeClasses[size])}
                fill={filled ? "currentColor" : "none"}
                strokeWidth={1.75}
              />
            </button>
          );
        })}
        {value > 0 && (
          <span className="ml-2 text-sm font-bold text-primary">{value}/5</span>
        )}
      </div>
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}
