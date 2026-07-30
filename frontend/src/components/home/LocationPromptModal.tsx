"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { LocateFixed, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUserLocation } from "@/contexts/user-location-context";
import { findNearestCity } from "@/lib/location/nearest-city";
import {
  LOCATION_PROMPT_CITIES,
  TARGET_CITIES,
} from "@/config/locations/cities-data";

/** Delay before the first-visit prompt appears, so it doesn't flash before the page settles. */
const OPEN_DELAY_MS = 600;

const CITY_OPTIONS = (() => {
  const seen = new Set<string>();
  const list: { value: string; label: string; city: string; stateCode: string; slug: string }[] =
    [];
  for (const c of [...LOCATION_PROMPT_CITIES, ...TARGET_CITIES]) {
    if (seen.has(c.slug)) continue;
    seen.add(c.slug);
    list.push({
      value: c.slug,
      label: `${c.city}, ${c.stateCode}`,
      city: c.city,
      stateCode: c.stateCode,
      slug: c.slug,
    });
  }
  return list.sort((a, b) => a.label.localeCompare(b.label));
})();

export function LocationPromptModal() {
  const { hasBeenPrompted, setLocation, dismissPrompt } = useUserLocation();
  const [open, setOpen] = useState(false);
  const [citySlug, setCitySlug] = useState("");
  const [detecting, setDetecting] = useState(false);
  const [detectError, setDetectError] = useState<string | null>(null);

  useEffect(() => {
    if (hasBeenPrompted) return;
    const timer = setTimeout(() => setOpen(true), OPEN_DELAY_MS);
    return () => clearTimeout(timer);
  }, [hasBeenPrompted]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  function close() {
    setOpen(false);
    dismissPrompt();
  }

  function choose(
    city: string,
    stateCode: string,
    slug: string | undefined,
    source: "popular" | "search"
  ) {
    setLocation({ city, stateCode, slug, source });
    setOpen(false);
  }

  function handleDetect() {
    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      setDetectError("Your browser doesn't support location detection.");
      return;
    }
    setDetectError(null);
    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const nearest = findNearestCity(
          position.coords.latitude,
          position.coords.longitude
        );
        setDetecting(false);
        choose(nearest.city, nearest.stateCode, nearest.slug, "search");
      },
      (error) => {
        setDetecting(false);
        setDetectError(
          error.code === error.PERMISSION_DENIED
            ? "Location access was denied. Choose your city below instead."
            : "We couldn't detect your location. Choose your city below instead."
        );
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300_000 }
    );
  }

  function handleShowResults() {
    const selected = CITY_OPTIONS.find((c) => c.value === citySlug);
    if (!selected) return;
    choose(selected.city, selected.stateCode, selected.slug, "search");
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
            className="fixed inset-0 z-[60] bg-black/50"
          />
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              role="dialog"
              aria-modal="true"
              aria-labelledby="location-prompt-title"
              className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
            >
              <div className="flex items-start justify-between gap-4">
                <h2
                  id="location-prompt-title"
                  className="text-xl font-bold text-primary"
                >
                  Where are you shopping for a car?
                </h2>
                <button
                  type="button"
                  onClick={close}
                  aria-label="Close"
                  className="-mr-1 -mt-1 shrink-0 rounded-full p-1.5 text-muted-foreground hover:bg-secondary"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <p className="mt-1.5 text-sm text-muted-foreground">
                We&apos;ll show you the closest inventory, dealers, and
                personalized deals for your area.
              </p>

              <Button
                type="button"
                variant="outline"
                className="mt-5 w-full"
                onClick={handleDetect}
                disabled={detecting}
              >
                <LocateFixed className="h-4 w-4" />
                {detecting ? "Detecting your location…" : "Detect my location"}
              </Button>
              {detectError && (
                <p className="mt-2 text-sm text-destructive">{detectError}</p>
              )}

              <div className="my-5 flex items-center gap-3">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs font-medium uppercase text-muted-foreground">
                  or choose your city
                </span>
                <div className="h-px flex-1 bg-border" />
              </div>

              <div className="flex flex-col gap-1.5">
                <span className="text-sm font-semibold text-foreground">
                  City
                </span>
                <Select
                  value={citySlug || undefined}
                  onValueChange={setCitySlug}
                >
                  <SelectTrigger
                    aria-label="City"
                    className="h-11 rounded-lg border-input bg-white"
                  >
                    <SelectValue placeholder="Select a city" />
                  </SelectTrigger>
                  <SelectContent position="popper" className="max-h-72">
                    {CITY_OPTIONS.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="mt-5">
                <p className="mb-2.5 text-xs font-semibold uppercase text-muted-foreground">
                  Popular cities
                </p>
                <div className="flex flex-wrap gap-2">
                  {LOCATION_PROMPT_CITIES.map((c) => (
                    <button
                      key={c.slug}
                      type="button"
                      onClick={() =>
                        choose(c.city, c.stateCode, c.slug, "popular")
                      }
                      className="rounded-lg border border-border/70 bg-secondary/60 px-3.5 py-1.5 text-sm font-medium text-primary transition-colors hover:border-primary/40 hover:bg-secondary"
                    >
                      {c.city}, {c.stateCode}
                    </button>
                  ))}
                </div>
              </div>

              <Button
                type="button"
                variant="gold"
                size="lg"
                className="mt-6 w-full"
                onClick={handleShowResults}
                disabled={!citySlug}
              >
                Show my results
              </Button>
              <button
                type="button"
                onClick={close}
                className="mt-3 w-full text-center text-sm font-medium text-muted-foreground hover:text-primary hover:underline"
              >
                Browse all cars instead
              </button>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
