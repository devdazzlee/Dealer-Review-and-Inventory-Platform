import type { RatingSourceSettings } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { calculateCombinedRating } from "../utils/rating";
import { REVIEW_STATUS } from "../config/constants";

const DEFAULT_SETTINGS = {
  googleEnabled: true,
  yelpEnabled: true,
  carfaxEnabled: true,
  autoSalesReviewsEnabled: true,
  platformEnabled: true,
};

export class RatingService {
  async getSettings() {
    const existing = await prisma.ratingSourceSettings.findFirst({
      orderBy: { updatedAt: "desc" },
    });
    if (existing) return existing;

    return prisma.ratingSourceSettings.create({ data: DEFAULT_SETTINGS });
  }

  async updateSettings(
    data: Partial<{
      googleEnabled: boolean;
      yelpEnabled: boolean;
      carfaxEnabled: boolean;
      autoSalesReviewsEnabled: boolean;
      platformEnabled: boolean;
    }>
  ) {
    const current = await this.getSettings();
    const updated = await prisma.ratingSourceSettings.update({
      where: { id: current.id },
      data,
    });
    await this.recalculateAllDealers();
    return updated;
  }

  /**
   * Recalculate platformRating from approved reviews, then combinedRating
   * using global source toggles. Accepts pre-fetched settings so bulk
   * callers (recalculateAllDealers) don't re-query them per dealer.
   */
  async recalculateDealer(dealerId: string, settings?: RatingSourceSettings) {
    const resolvedSettings = settings ?? (await this.getSettings());

    const [dealer, approved] = await Promise.all([
      prisma.dealer.findUniqueOrThrow({ where: { id: dealerId } }),
      prisma.review.findMany({
        where: { dealerId, status: REVIEW_STATUS.approved },
        select: { overallRating: true },
      }),
    ]);

    const platformReviewCount = approved.length;
    const platformRating =
      platformReviewCount > 0
        ? Math.round(
            (approved.reduce((s, r) => s + r.overallRating, 0) /
              platformReviewCount) *
              10
          ) / 10
        : null;

    const { combinedRating } = calculateCombinedRating(
      { ...dealer, platformRating, platformReviewCount },
      resolvedSettings
    );

    return prisma.dealer.update({
      where: { id: dealerId },
      data: { platformRating, platformReviewCount, combinedRating },
    });
  }

  /** Bounded concurrency — enough to be fast without overwhelming the DB connection pool. */
  async recalculateAllDealers() {
    const settings = await this.getSettings();
    const dealers = await prisma.dealer.findMany({ select: { id: true } });
    const CONCURRENCY = 15;

    for (let i = 0; i < dealers.length; i += CONCURRENCY) {
      const batch = dealers.slice(i, i + CONCURRENCY);
      await Promise.all(
        batch.map((d) => this.recalculateDealer(d.id, settings))
      );
    }
  }

  previewCombined(
    dealer: Parameters<typeof calculateCombinedRating>[0],
    settings: Parameters<typeof calculateCombinedRating>[1]
  ) {
    return calculateCombinedRating(dealer, settings);
  }
}

export const ratingService = new RatingService();
