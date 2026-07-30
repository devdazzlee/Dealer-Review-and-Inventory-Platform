"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Search } from "lucide-react";
import {
  MAKES,
  MODELS_BY_MAKE,
  MAX_PRICE_OPTIONS,
  YEARS,
} from "@/config/vehicle";
import { ROUTES } from "@/config/constants";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const ALL = "__all__";

interface VehicleSearchBarProps {
  layout?: "hero" | "bar";
  submitLabel?: string;
  bodyStyle?: string;
  defaultValues?: {
    make?: string;
    model?: string;
    year?: string;
    priceTo?: string;
  };
  className?: string;
}

function FieldSelect({
  label,
  value,
  onValueChange,
  placeholder,
  disabled,
  children,
}: {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  placeholder: string;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <Select
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
      >
        <SelectTrigger
          aria-label={label}
          className="h-11 rounded-lg border-input bg-white"
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent position="popper" className="max-h-72">
          {children}
        </SelectContent>
      </Select>
    </div>
  );
}

export function VehicleSearchBar({
  layout = "hero",
  submitLabel = "Search",
  bodyStyle,
  defaultValues,
  className,
}: VehicleSearchBarProps) {
  const router = useRouter();
  const [make, setMake] = useState(defaultValues?.make ?? "");
  const [model, setModel] = useState(defaultValues?.model ?? "");
  const [year, setYear] = useState(defaultValues?.year ?? "");
  const [priceTo, setPriceTo] = useState(defaultValues?.priceTo ?? "");
  const [isPending, startTransition] = useTransition();

  const models = useMemo(
    () => (make ? MODELS_BY_MAKE[make] ?? [] : []),
    [make]
  );

  function handleMakeChange(value: string) {
    const nextMake = value === ALL ? "" : value;
    setMake(nextMake);
    setModel("");
  }

  function handleSubmit(e?: React.FormEvent) {
    e?.preventDefault();
    const params = new URLSearchParams();
    if (bodyStyle) params.set("bodyStyle", bodyStyle);
    if (make) params.set("make", make);
    if (model) params.set("model", model);
    if (year) params.set("yearFrom", year);
    if (priceTo) params.set("priceTo", priceTo);
    const query = params.toString();
    startTransition(() => {
      router.push(query ? `${ROUTES.vehicles}?${query}` : ROUTES.vehicles);
    });
  }

  const isHero = layout === "hero";

  // Use a div (not <form>) so Radix does not inject a native <select> sibling
  // that causes double arrows / OS dropdowns inside forms on Windows.
  return (
    <div
      className={cn(
        isHero
          ? "rounded-xl bg-white p-4 shadow-card sm:p-5"
          : "rounded-lg border border-border/70 bg-white p-4 shadow-card",
        className
      )}
    >
      <div
        className={cn(
          "grid gap-3",
          isHero
            ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-[repeat(4,minmax(0,1fr))_auto]"
            : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-[repeat(4,minmax(0,1fr))_auto]"
        )}
      >
        <FieldSelect
          label="Make"
          value={make || ALL}
          onValueChange={handleMakeChange}
          placeholder="All Makes"
        >
          <SelectItem value={ALL}>All Makes</SelectItem>
          {MAKES.map((m) => (
            <SelectItem key={m} value={m}>
              {m}
            </SelectItem>
          ))}
        </FieldSelect>

        <FieldSelect
          label="Model"
          value={model || ALL}
          onValueChange={(v) => setModel(v === ALL ? "" : v)}
          placeholder={make ? "All Models" : "Select a make first"}
          disabled={!make}
        >
          <SelectItem value={ALL}>
            {make ? "All Models" : "Select a make first"}
          </SelectItem>
          {models.map((m) => (
            <SelectItem key={m} value={m}>
              {m}
            </SelectItem>
          ))}
        </FieldSelect>

        <FieldSelect
          label="Year"
          value={year || ALL}
          onValueChange={(v) => setYear(v === ALL ? "" : v)}
          placeholder="Any Year"
        >
          <SelectItem value={ALL}>Any Year</SelectItem>
          {YEARS.map((y) => (
            <SelectItem key={y} value={String(y)}>
              {y}
            </SelectItem>
          ))}
        </FieldSelect>

        <FieldSelect
          label="Max Price"
          value={priceTo || ALL}
          onValueChange={(v) => setPriceTo(v === ALL ? "" : v)}
          placeholder="No Max"
        >
          <SelectItem value={ALL}>No Max</SelectItem>
          {MAX_PRICE_OPTIONS.map((p) => (
            <SelectItem key={p.value} value={p.value}>
              {p.label}
            </SelectItem>
          ))}
        </FieldSelect>

        <div className="flex flex-col justify-end sm:col-span-2 lg:col-span-4 xl:col-span-1">
          <Button
            type="button"
            variant="gold"
            size="lg"
            disabled={isPending}
            onClick={() => handleSubmit()}
            className="h-11 w-full gap-3 px-8 xl:w-auto xl:min-w-[13rem] xl:shrink-0"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <Search className="h-4 w-4" />
                {submitLabel}
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
