import { prisma } from "../lib/prisma";
import { ratingService } from "./rating.service";
import { fetchPlaceRating, isPlacesConfigured } from "./places.client";

export interface RatingsSyncResult {
  updated: number;
  skipped: number;
  failed: number;
  message: string;
}

export async function syncGoogleRatings(): Promise<RatingsSyncResult> {
  const startedAt = new Date();
  const result: RatingsSyncResult = {
    updated: 0,
    skipped: 0,
    failed: 0,
    message: "",
  };

  if (!isPlacesConfigured()) {
    result.message = "GOOGLE_PLACES_API_KEY is not set; skipped Places sync";
    await prisma.syncRun.create({
      data: {
        job: "ratings",
        startedAt,
        finishedAt: new Date(),
        message: result.message,
      },
    });
    return result;
  }

  const dealers = await prisma.dealer.findMany({
    where: { googlePlaceId: { not: null } },
    select: { id: true, googlePlaceId: true },
  });

  for (const dealer of dealers) {
    if (!dealer.googlePlaceId) {
      result.skipped += 1;
      continue;
    }
    try {
      const place = await fetchPlaceRating(dealer.googlePlaceId);
      await prisma.dealer.update({
        where: { id: dealer.id },
        data: {
          googleRating: place.rating,
          googleReviewCount: place.reviewCount,
        },
      });
      await ratingService.recalculateDealer(dealer.id);
      result.updated += 1;
    } catch (error) {
      result.failed += 1;
      console.error(`[ratings-sync] dealer ${dealer.id}`, error);
    }
  }

  result.message = `Google ratings: ${result.updated} updated, ${result.failed} failed`;
  await prisma.syncRun.create({
    data: {
      job: "ratings",
      startedAt,
      finishedAt: new Date(),
      updated: result.updated,
      failed: result.failed,
      message: result.message,
    },
  });
  console.log(`[ratings-sync] ${result.message}`);
  return result;
}
