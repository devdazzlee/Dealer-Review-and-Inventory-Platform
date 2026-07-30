"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { SORT_OPTIONS } from "@/config/vehicle";
import { ROUTES } from "@/config/constants";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function VehicleSortSelect({ value }: { value: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleChange(next: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "relevance") {
      params.delete("sort");
    } else {
      params.set("sort", next);
    }
    const query = params.toString();
    router.push(query ? `${ROUTES.vehicles}?${query}` : ROUTES.vehicles);
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="hidden font-medium text-muted-foreground sm:inline">
        Sort:
      </span>
      <Select value={value} onValueChange={handleChange}>
        <SelectTrigger
          aria-label="Sort vehicles by"
          className="h-9 w-[11.5rem] rounded-lg border-input bg-white font-semibold"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="max-h-72">
          {SORT_OPTIONS.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
