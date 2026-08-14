import type { RatingSourceSettings } from "@prisma/client";
import { toDealerSummaryDto } from "./dealer.dto";
import type { VehicleWithDealer } from "../repositories/vehicle.repository";

const ACCENTS = ["#003087", "#1a4a8c", "#2f6b7a", "#5a4a7a", "#6b5535"];

function accentFor(vin: string): string {
  let h = 0;
  for (let i = 0; i < vin.length; i++) h = (h * 31 + vin.charCodeAt(i)) >>> 0;
  return ACCENTS[h % ACCENTS.length];
}

function asBodyStyle(value: string | null): string {
  return value || "Sedan";
}

function asCondition(value: string | null): "NEW" | "USED" | "CPO" {
  if (value === "NEW" || value === "CPO") return value;
  return "USED";
}

function asFuel(value: string | null): string {
  return value || "Gasoline";
}

function isHotlinkedFeedPhoto(url: string): boolean {
  const lower = url.toLowerCase();
  return lower.includes("auto.dev") || lower.includes("photos.vin");
}

function publicPhotos(urls: string[]): string[] {
  return urls.filter((url) => url && !isHotlinkedFeedPhoto(url));
}

export function toVehicleDto(
  vehicle: VehicleWithDealer,
  settings?: RatingSourceSettings
) {
  const dealer = toDealerSummaryDto(vehicle.dealer, settings);
  return {
    id: vehicle.id,
    year: vehicle.year,
    make: vehicle.make,
    model: vehicle.model,
    trim: vehicle.trim ?? "",
    price: vehicle.price ?? 0,
    mileage: vehicle.mileage ?? 0,
    bodyStyle: asBodyStyle(vehicle.bodyStyle),
    condition: asCondition(vehicle.condition),
    fuelType: asFuel(vehicle.fuelType),
    transmission: vehicle.transmission ?? "Automatic",
    drivetrain: "",
    exteriorColor: vehicle.exteriorColor ?? "",
    interiorColor: vehicle.interiorColor ?? "",
    vin: vehicle.vin,
    mpg: "",
    photos: publicPhotos(vehicle.photos),
    photoCount:
      vehicle.cachedPhotoCount || publicPhotos(vehicle.photos).length,
    accent: accentFor(vehicle.vin),
    description: vehicle.description ?? "",
    features: vehicle.features,
    freshness: vehicle.updatedAt.getTime(),
    dealer: {
      name: dealer.name,
      slug: dealer.slug,
      city: dealer.city,
      state: dealer.state,
      phone: dealer.phone ?? "",
      featured: dealer.featured,
      ratings: {
        google: dealer.googleRating,
        googleCount: dealer.googleReviewCount ?? 0,
        yelp: dealer.yelpRating,
        yelpCount: dealer.yelpReviewCount ?? 0,
        carfax: dealer.carfaxRating,
        autoSalesReviews: dealer.autoSalesReviewsRating,
        platform: dealer.platformRating,
        platformCount: dealer.platformReviewCount,
        combined: dealer.combinedRating,
        totalReviews: dealer.totalReviews,
        sources: dealer.ratingSources,
      },
    },
  };
}
