"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import type { VehicleFilters as Filters } from "@/types/vehicle";
import {
  BODY_STYLES,
  CONDITIONS,
  MAKES,
  MILEAGE_OPTIONS,
  MODELS_BY_MAKE,
  PRICE_OPTIONS,
  RATING_FILTER_OPTIONS,
  YEARS,
} from "@/config/vehicle";
import { STATES } from "@/config/constants";
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

interface VehicleFiltersProps {
  filters: Filters;
  sort?: string;
  onApplied?: () => void;
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-b border-border/70 py-4 first:pt-0">
      <h3 className="mb-2.5 text-sm font-bold text-primary">{title}</h3>
      {children}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "rounded-md border px-2.5 py-1 text-xs font-semibold transition-colors",
        active
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-white text-foreground hover:border-primary/40"
      )}
    >
      {children}
    </button>
  );
}

function FilterSelect({
  value,
  onValueChange,
  placeholder,
  label,
  disabled,
  children,
}: {
  value: string;
  onValueChange: (value: string) => void;
  placeholder: string;
  label: string;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Select
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
    >
      <SelectTrigger
        aria-label={label}
        className="h-9 rounded-lg border-input bg-white"
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="max-h-72">{children}</SelectContent>
    </Select>
  );
}

export function VehicleFilters({
  filters,
  sort,
  onApplied,
}: VehicleFiltersProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [make, setMake] = useState(filters.make ?? "");
  const [model, setModel] = useState(filters.model ?? "");
  const [yearFrom, setYearFrom] = useState(filters.yearFrom?.toString() ?? "");
  const [yearTo, setYearTo] = useState(filters.yearTo?.toString() ?? "");
  const [priceFrom, setPriceFrom] = useState(
    filters.priceFrom?.toString() ?? ""
  );
  const [priceTo, setPriceTo] = useState(filters.priceTo?.toString() ?? "");
  const [maxMileage, setMaxMileage] = useState(
    filters.maxMileage?.toString() ?? "any"
  );
  const [bodyStyle, setBodyStyle] = useState(filters.bodyStyle ?? "");
  const [condition, setCondition] = useState(filters.condition ?? "");
  const [state, setState] = useState(filters.state ?? "");
  const [minRating, setMinRating] = useState(
    filters.minRating?.toString() ?? ""
  );

  const models = useMemo(
    () => (make ? MODELS_BY_MAKE[make] ?? [] : []),
    [make]
  );

  function toggle(current: string, value: string, set: (v: string) => void) {
    set(current === value ? "" : value);
  }

  function handleMakeChange(value: string) {
    setMake(value === ALL ? "" : value);
    setModel("");
  }

  function apply() {
    const params = new URLSearchParams();
    if (make) params.set("make", make);
    if (model) params.set("model", model);
    if (yearFrom) params.set("yearFrom", yearFrom);
    if (yearTo) params.set("yearTo", yearTo);
    if (priceFrom) params.set("priceFrom", priceFrom);
    if (priceTo) params.set("priceTo", priceTo);
    if (maxMileage && maxMileage !== "any")
      params.set("maxMileage", maxMileage);
    if (bodyStyle) params.set("bodyStyle", bodyStyle);
    if (condition) params.set("condition", condition);
    if (state) params.set("state", state);
    if (minRating) params.set("minRating", minRating);
    if (sort && sort !== "relevance") params.set("sort", sort);
    const query = params.toString();
    startTransition(() => {
      router.push(query ? `${ROUTES.vehicles}?${query}` : ROUTES.vehicles);
    });
    onApplied?.();
  }

  function clearAll() {
    startTransition(() => {
      router.push(ROUTES.vehicles);
    });
    onApplied?.();
  }

  return (
    <div>
      <div className="flex items-center justify-between pb-2">
        <h2 className="text-base font-bold text-primary">Filters</h2>
        <button
          type="button"
          onClick={clearAll}
          className="text-xs font-semibold text-accent-foreground/70 hover:text-primary hover:underline"
        >
          Clear all
        </button>
      </div>

      <Section title="Make">
        <FilterSelect
          value={make || ALL}
          onValueChange={handleMakeChange}
          placeholder="All Makes"
          label="Make"
        >
          <SelectItem value={ALL}>All Makes</SelectItem>
          {MAKES.map((m) => (
            <SelectItem key={m} value={m}>
              {m}
            </SelectItem>
          ))}
        </FilterSelect>
      </Section>

      <Section title="Model">
        <FilterSelect
          value={model || ALL}
          onValueChange={(v) => setModel(v === ALL ? "" : v)}
          placeholder={make ? "All Models" : "Select a make first"}
          label="Model"
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
        </FilterSelect>
      </Section>

      <Section title="Year">
        <div className="grid grid-cols-2 gap-2">
          <FilterSelect
            value={yearFrom || ALL}
            onValueChange={(v) => setYearFrom(v === ALL ? "" : v)}
            placeholder="From"
            label="Year from"
          >
            <SelectItem value={ALL}>From</SelectItem>
            {YEARS.map((y) => (
              <SelectItem key={y} value={String(y)}>
                {y}
              </SelectItem>
            ))}
          </FilterSelect>
          <FilterSelect
            value={yearTo || ALL}
            onValueChange={(v) => setYearTo(v === ALL ? "" : v)}
            placeholder="To"
            label="Year to"
          >
            <SelectItem value={ALL}>To</SelectItem>
            {YEARS.map((y) => (
              <SelectItem key={y} value={String(y)}>
                {y}
              </SelectItem>
            ))}
          </FilterSelect>
        </div>
      </Section>

      <Section title="Price">
        <div className="grid grid-cols-2 gap-2">
          <FilterSelect
            value={priceFrom || ALL}
            onValueChange={(v) => setPriceFrom(v === ALL ? "" : v)}
            placeholder="Min"
            label="Minimum price"
          >
            <SelectItem value={ALL}>Min</SelectItem>
            {PRICE_OPTIONS.map((p) => (
              <SelectItem key={p.value} value={String(p.value)}>
                {p.label}
              </SelectItem>
            ))}
          </FilterSelect>
          <FilterSelect
            value={priceTo || ALL}
            onValueChange={(v) => setPriceTo(v === ALL ? "" : v)}
            placeholder="Max"
            label="Maximum price"
          >
            <SelectItem value={ALL}>Max</SelectItem>
            {PRICE_OPTIONS.map((p) => (
              <SelectItem key={p.value} value={String(p.value)}>
                {p.label}
              </SelectItem>
            ))}
          </FilterSelect>
        </div>
      </Section>

      <Section title="Mileage">
        <FilterSelect
          value={maxMileage || "any"}
          onValueChange={setMaxMileage}
          placeholder="Any mileage"
          label="Maximum mileage"
        >
          {MILEAGE_OPTIONS.map((m) => (
            <SelectItem key={m.value} value={m.value}>
              {m.label}
            </SelectItem>
          ))}
        </FilterSelect>
      </Section>

      <Section title="Body Style">
        <div className="flex flex-wrap gap-1.5">
          {BODY_STYLES.map((b) => (
            <Chip
              key={b.value}
              active={bodyStyle === b.value}
              onClick={() => toggle(bodyStyle, b.value, setBodyStyle)}
            >
              {b.label}
            </Chip>
          ))}
        </div>
      </Section>

      <Section title="Condition">
        <div className="flex flex-wrap gap-1.5">
          {CONDITIONS.map((c) => (
            <Chip
              key={c.value}
              active={condition === c.value}
              onClick={() => toggle(condition, c.value, setCondition)}
            >
              {c.label}
            </Chip>
          ))}
        </div>
      </Section>

      <Section title="State">
        <FilterSelect
          value={state || ALL}
          onValueChange={(v) => setState(v === ALL ? "" : v)}
          placeholder="All States"
          label="State"
        >
          <SelectItem value={ALL}>All States</SelectItem>
          {STATES.map((s) => (
            <SelectItem key={s.code} value={s.code}>
              {s.label}
            </SelectItem>
          ))}
        </FilterSelect>
      </Section>

      <Section title="Dealer Rating">
        <div className="flex flex-wrap gap-1.5">
          {RATING_FILTER_OPTIONS.map((r) => (
            <Chip
              key={r.value}
              active={minRating === r.value}
              onClick={() => toggle(minRating, r.value, setMinRating)}
            >
              {r.label}
            </Chip>
          ))}
        </div>
      </Section>

      <div className="sticky bottom-0 -mx-4 mt-2 border-t border-border/70 bg-white px-4 pt-4 pb-1">
        <Button
          type="button"
          variant="gold"
          className="w-full"
          onClick={apply}
          disabled={isPending}
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading...
            </>
          ) : (
            "Apply Filters"
          )}
        </Button>
      </div>
    </div>
  );
}
