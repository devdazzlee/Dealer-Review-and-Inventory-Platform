import { listVehicles } from "@/lib/api/vehicles";
import { HOME_BODY_STYLES, LUXURY_MAKES } from "@/config/vehicle";
import { BrowseByCategoryClient } from "@/components/home/BrowseByCategoryClient";
import type { Vehicle } from "@/types/vehicle";

const CARDS_PER_CATEGORY = 4;

export async function BrowseByCategory() {
  const entries = await Promise.all(
    HOME_BODY_STYLES.map(async (category) => {
      try {
        const { data } = await listVehicles({
          filters:
            category.value === "Luxury"
              ? { make: LUXURY_MAKES.join(",") }
              : { bodyStyle: category.value },
          page: 1,
          pageSize: CARDS_PER_CATEGORY,
        });
        return [category.value, data] as const;
      } catch {
        return [category.value, [] as Vehicle[]] as const;
      }
    })
  );

  const vehiclesByCategory = Object.fromEntries(entries);

  return <BrowseByCategoryClient vehiclesByCategory={vehiclesByCategory} />;
}
