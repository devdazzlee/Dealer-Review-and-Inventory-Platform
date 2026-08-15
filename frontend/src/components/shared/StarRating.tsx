import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating: number;
  size?: "sm" | "md" | "lg" | "xl";
  showValue?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: "h-3.5 w-3.5",
  md: "h-4 w-4",
  lg: "h-5 w-5",
  xl: "h-6 w-6",
} as const;

const valueSizeClasses = {
  sm: "text-xs",
  md: "text-sm",
  lg: "text-base",
  xl: "text-lg",
} as const;

export function StarRating({
  rating,
  size = "md",
  showValue = false,
  className,
}: StarRatingProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex" role="img" aria-label={`${rating} out of 5 stars`}>
        {Array.from({ length: 5 }, (_, index) => {
          const fill = Math.min(Math.max(rating - index, 0), 1);

          return (
            <div key={index} className="relative">
              <Star
                className={cn(sizeClasses[size], "text-muted-foreground/20")}
                fill="currentColor"
              />
              <div
                className="absolute inset-0 overflow-hidden"
                style={{ width: `${fill * 100}%` }}
              >
                <Star
                  className={cn(sizeClasses[size], "text-accent drop-shadow-sm")}
                  fill="currentColor"
                />
              </div>
            </div>
          );
        })}
      </div>
      {showValue && (
        <span
          className={cn(
            "font-semibold text-foreground",
            valueSizeClasses[size]
          )}
        >
          {rating > 0 ? rating.toFixed(1) : "No ratings"}
        </span>
      )}
    </div>
  );
}
