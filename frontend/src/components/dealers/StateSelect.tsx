"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { STATES } from "@/config/constants";
import { cn } from "@/lib/utils";

interface StateSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  includeAll?: boolean;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
}

export function StateSelect({
  value,
  onValueChange,
  includeAll = true,
  className,
  placeholder = "State",
  disabled = false,
}: StateSelectProps) {
  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger aria-label={placeholder} className={cn("w-full", className)}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {includeAll && <SelectItem value="All">All States</SelectItem>}
        {STATES.map((state) => (
          <SelectItem key={state.code} value={state.code}>
            {state.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
