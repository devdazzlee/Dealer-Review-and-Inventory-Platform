"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Car } from "lucide-react";
import type { Vehicle } from "@/types/vehicle";
import { ROUTES } from "@/config/constants";
import { MAX_PRICE_OPTIONS } from "@/config/vehicle";
import { VehicleCard } from "@/components/vehicles/VehicleCard";
import { VehiclePhoto } from "@/components/vehicles/VehiclePhoto";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DealerReviewsPanel } from "@/components/dealers/reviews/DealerReviewsPanel";
import { ReviewSubmissionForm } from "@/components/dealers/reviews/ReviewSubmissionForm";
import { cn } from "@/lib/utils";

type TabKey = "inventory" | "reviews" | "about" | "photos";

const TABS: { key: TabKey; label: string }[] = [
  { key: "inventory", label: "Inventory" },
  { key: "reviews", label: "Reviews" },
  { key: "about", label: "About" },
  { key: "photos", label: "Photos" },
];

const ALL = "__all__";

interface DealerProfileTabsProps {
  dealerSlug: string;
  dealerName: string;
  description: string;
  vehicles: Vehicle[];
  initialTab?: TabKey;
}

function InventoryTab({ vehicles }: { vehicles: Vehicle[] }) {
  const makes = useMemo(
    () => Array.from(new Set(vehicles.map((v) => v.make))).sort(),
    [vehicles]
  );
  const years = useMemo(
    () => Array.from(new Set(vehicles.map((v) => v.year))).sort((a, b) => b - a),
    [vehicles]
  );
  const bodies = useMemo(
    () => Array.from(new Set(vehicles.map((v) => v.bodyStyle))).sort(),
    [vehicles]
  );

  const models = useMemo(
    () => Array.from(new Set(vehicles.map((v) => v.model))).sort(),
    [vehicles]
  );
  const conditions = useMemo(
    () => Array.from(new Set(vehicles.map((v) => v.condition))).sort(),
    [vehicles]
  );

  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [body, setBody] = useState("");
  const [condition, setCondition] = useState("");
  const [applied, setApplied] = useState({
    make: "",
    model: "",
    year: "",
    maxPrice: "",
    body: "",
    condition: "",
  });

  const filtered = vehicles.filter((v) => {
    if (applied.make && v.make !== applied.make) return false;
    if (applied.model && v.model !== applied.model) return false;
    if (applied.year && v.year !== Number(applied.year)) return false;
    if (applied.maxPrice && v.price > Number(applied.maxPrice)) return false;
    if (applied.body && v.bodyStyle !== applied.body) return false;
    if (applied.condition && v.condition !== applied.condition) return false;
    return true;
  });

  if (vehicles.length === 0) {
    return (
      <EmptyState
        icon={Car}
        title="Check back soon"
        description="Live inventory is not available right now. Check back soon or contact the dealership for current availability."
      />
    );
  }

  return (
    <div>
      <h2 className="sr-only">Inventory</h2>
      <div className="mb-5 flex flex-wrap items-end gap-2 rounded-lg border border-border/70 bg-white p-3 shadow-card">
        <Select
          value={make || ALL}
          onValueChange={(v) => setMake(v === ALL ? "" : v)}
        >
          <SelectTrigger aria-label="Make" className="h-9 w-[9.5rem] rounded-lg border-input bg-white">
            <SelectValue placeholder="All Makes" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All Makes</SelectItem>
            {makes.map((m) => (
              <SelectItem key={m} value={m}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={model || ALL}
          onValueChange={(v) => setModel(v === ALL ? "" : v)}
        >
          <SelectTrigger aria-label="Model" className="h-9 w-[9.5rem] rounded-lg border-input bg-white">
            <SelectValue placeholder="All Models" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All Models</SelectItem>
            {models.map((m) => (
              <SelectItem key={m} value={m}>
                {m}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={year || ALL}
          onValueChange={(v) => setYear(v === ALL ? "" : v)}
        >
          <SelectTrigger aria-label="Year" className="h-9 w-[8.5rem] rounded-lg border-input bg-white">
            <SelectValue placeholder="All Years" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All Years</SelectItem>
            {years.map((y) => (
              <SelectItem key={y} value={String(y)}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={maxPrice || ALL}
          onValueChange={(v) => setMaxPrice(v === ALL ? "" : v)}
        >
          <SelectTrigger aria-label="Maximum price" className="h-9 w-[8.5rem] rounded-lg border-input bg-white">
            <SelectValue placeholder="Max Price" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Max Price</SelectItem>
            {MAX_PRICE_OPTIONS.map((p) => (
              <SelectItem key={p.value} value={p.value}>
                {p.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={body || ALL}
          onValueChange={(v) => setBody(v === ALL ? "" : v)}
        >
          <SelectTrigger aria-label="Body style" className="h-9 w-[8.5rem] rounded-lg border-input bg-white">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All Types</SelectItem>
            {bodies.map((b) => (
              <SelectItem key={b} value={b}>
                {b}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={condition || ALL}
          onValueChange={(v) => setCondition(v === ALL ? "" : v)}
        >
          <SelectTrigger aria-label="Condition" className="h-9 w-[8.5rem] rounded-lg border-input bg-white">
            <SelectValue placeholder="Condition" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>All Conditions</SelectItem>
            {conditions.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          type="button"
          variant="gold"
          size="sm"
          onClick={() =>
            setApplied({ make, model, year, maxPrice, body, condition })
          }
        >
          Apply
        </Button>
        <span className="ml-auto text-sm font-semibold text-muted-foreground">
          {filtered.length} of {vehicles.length}
        </span>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={Car}
          title="No matching vehicles"
          description="Try adjusting the filters to see more of this dealer's inventory."
        />
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((v) => (
            <VehicleCard key={v.id} vehicle={v} />
          ))}
        </div>
      )}
    </div>
  );
}

function ReviewsTab({
  dealerSlug,
  dealerName,
}: {
  dealerSlug: string;
  dealerName: string;
}) {
  return (
    <div className="space-y-8">
      <h2 className="sr-only">Reviews</h2>
      <DealerReviewsPanel
        dealerSlug={dealerSlug}
        onWriteReview={() => {
          document
            .getElementById("write-review")
            ?.scrollIntoView({ behavior: "smooth", block: "start" });
        }}
      />
      <div id="write-review">
        <ReviewSubmissionForm
          dealerSlug={dealerSlug}
          dealerName={dealerName}
        />
      </div>
    </div>
  );
}

function AboutTab({
  description,
  dealerName,
}: {
  description: string;
  dealerName: string;
}) {
  return (
    <div className="rounded-lg border border-border/70 bg-white p-5 shadow-card">
      <h2 className="mb-2 text-lg font-bold text-primary">
        About {dealerName}
      </h2>
      <p className="leading-relaxed text-foreground/90">{description}</p>
    </div>
  );
}

function PhotosTab({ vehicles }: { vehicles: Vehicle[] }) {
  const tiles = vehicles.length > 0 ? vehicles.slice(0, 9) : [];
  if (tiles.length === 0) {
    return (
      <EmptyState
        icon={Car}
        title="No photos yet"
        description="Dealership photos will appear here soon."
      />
    );
  }
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {tiles.map((v) => (
        <Link
          key={v.id}
          href={ROUTES.vehicleDetail(v.id)}
          className="overflow-hidden rounded-lg border border-border/70 shadow-card transition-shadow hover:shadow-card-hover"
        >
          <VehiclePhoto
            vehicle={v}
            className="w-full"
            width={320}
            height={240}
            sizes="(max-width: 640px) 50vw, 320px"
            showCount={false}
          />
        </Link>
      ))}
    </div>
  );
}

export function DealerProfileTabs({
  dealerSlug,
  dealerName,
  description,
  vehicles,
  initialTab = "inventory",
}: DealerProfileTabsProps) {
  const [active, setActive] = useState<TabKey>(initialTab);

  useEffect(() => {
    function openReviewsFromHash() {
      const hash = window.location.hash.replace("#", "");
      if (hash === "write-review" || hash === "reviews") {
        setActive("reviews");
        if (hash === "write-review") {
          window.setTimeout(() => {
            document
              .getElementById("write-review")
              ?.scrollIntoView({ behavior: "smooth", block: "start" });
          }, 50);
        }
      }
    }
    openReviewsFromHash();
    window.addEventListener("hashchange", openReviewsFromHash);
    return () => window.removeEventListener("hashchange", openReviewsFromHash);
  }, []);

  return (
    <div>
      <div className="mb-6 border-b border-border/70">
        <div className="no-scrollbar flex gap-1 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActive(tab.key)}
              className={cn(
                "relative shrink-0 whitespace-nowrap px-4 py-3 text-sm font-bold transition-colors",
                active === tab.key
                  ? "text-primary"
                  : "text-muted-foreground hover:text-primary"
              )}
            >
              {tab.label}
              {tab.key === "inventory" && (
                <span className="ml-1.5 rounded-full bg-secondary px-1.5 py-0.5 text-xs font-bold text-primary">
                  {vehicles.length}
                </span>
              )}
              {active === tab.key && (
                <span className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-accent" />
              )}
            </button>
          ))}
        </div>
      </div>

      {active === "inventory" && <InventoryTab vehicles={vehicles} />}
      {active === "reviews" && (
        <ReviewsTab dealerSlug={dealerSlug} dealerName={dealerName} />
      )}
      {active === "about" && (
        <AboutTab description={description} dealerName={dealerName} />
      )}
      {active === "photos" && <PhotosTab vehicles={vehicles} />}
    </div>
  );
}
