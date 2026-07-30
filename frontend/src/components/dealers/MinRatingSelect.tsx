"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MIN_RATING_OPTIONS } from "@/config/constants";
import { cn } from "@/lib/utils";

interface MinRatingSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
  disabled?: boolean;
}

export function MinRatingSelect({
  value,
  onValueChange,
  className,
  disabled = false,
}: MinRatingSelectProps) {
  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger aria-label="Minimum dealer rating" className={cn("w-full", className)}>
        <SelectValue placeholder="Min Rating" />
      </SelectTrigger>
      <SelectContent>
        {MIN_RATING_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
