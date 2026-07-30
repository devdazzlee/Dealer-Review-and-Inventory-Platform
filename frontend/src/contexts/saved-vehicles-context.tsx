"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  fetchSavedVehicleIds,
  saveVehicleRemote,
  unsaveVehicleRemote,
} from "@/lib/api/saved";

interface SavedVehiclesContextValue {
  savedIds: Set<string>;
  count: number;
  hydrated: boolean;
  isSaved: (vehicleId: string) => boolean;
  isSaving: (vehicleId: string) => boolean;
  toggleSave: (vehicleId: string) => Promise<void>;
}

const SavedVehiclesContext = createContext<SavedVehiclesContextValue | null>(
  null
);

export function SavedVehiclesProvider({ children }: { children: ReactNode }) {
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [pendingIds, setPendingIds] = useState<Set<string>>(new Set());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let idleId: number | undefined;
    let timerId: number | undefined;

    const load = () => {
      fetchSavedVehicleIds()
        .then((data) => {
          if (cancelled) return;
          setSavedIds(new Set(data.vehicleIds));
        })
        .catch(() => {
          /* API offline — empty until retry */
        })
        .finally(() => {
          if (!cancelled) setHydrated(true);
        });
    };

    // Defer off the critical path so the homepage hydrate/LCP isn't competing
    // with a saved-ids network round-trip on every cold visit.
    if (typeof window.requestIdleCallback === "function") {
      idleId = window.requestIdleCallback(load, { timeout: 4000 });
    } else {
      timerId = window.setTimeout(load, 1500);
    }

    return () => {
      cancelled = true;
      if (idleId !== undefined) window.cancelIdleCallback(idleId);
      if (timerId !== undefined) window.clearTimeout(timerId);
    };
  }, []);

  const isSaved = useCallback(
    (vehicleId: string) => savedIds.has(vehicleId),
    [savedIds]
  );

  const isSaving = useCallback(
    (vehicleId: string) => pendingIds.has(vehicleId),
    [pendingIds]
  );

  const toggleSave = useCallback(
    async (vehicleId: string) => {
      let alreadyPending = false;
      setPendingIds((pending) => {
        if (pending.has(vehicleId)) {
          alreadyPending = true;
          return pending;
        }
        const next = new Set(pending);
        next.add(vehicleId);
        return next;
      });
      if (alreadyPending) return;

      // Let React paint the loading UI before the network call.
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => resolve());
      });

      const currentlySaved = savedIds.has(vehicleId);

      try {
        if (currentlySaved) {
          await unsaveVehicleRemote(vehicleId);
          setSavedIds((prev) => {
            const next = new Set(prev);
            next.delete(vehicleId);
            return next;
          });
        } else {
          await saveVehicleRemote(vehicleId);
          setSavedIds((prev) => {
            const next = new Set(prev);
            next.add(vehicleId);
            return next;
          });
        }
      } finally {
        setPendingIds((pending) => {
          const next = new Set(pending);
          next.delete(vehicleId);
          return next;
        });
      }
    },
    [savedIds]
  );

  const value = useMemo<SavedVehiclesContextValue>(
    () => ({
      savedIds,
      count: savedIds.size,
      hydrated,
      isSaved,
      isSaving,
      toggleSave,
    }),
    [savedIds, hydrated, isSaved, isSaving, toggleSave]
  );

  return (
    <SavedVehiclesContext.Provider value={value}>
      {children}
    </SavedVehiclesContext.Provider>
  );
}

export function useSavedVehicles() {
  const ctx = useContext(SavedVehiclesContext);
  if (!ctx) {
    throw new Error(
      "useSavedVehicles must be used within SavedVehiclesProvider"
    );
  }
  return ctx;
}
