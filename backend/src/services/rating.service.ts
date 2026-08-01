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
   * using global source toggles.
   */
  async recalculateDealer(dealerId: string) {
    const settings = await this.getSettings();

    const approved = await prisma.review.findMany({
      where: { dealerId, status: REVIEW_STATUS.approved },
      select: { overallRating: true },
    });

    const platformReviewCount = approved.length;
    const platformRating =
      platformReviewCount > 0
        ? Math.round(
            (approved.reduce((s, r) => s + r.overallRating, 0) /
              platformReviewCount) *
              10
          ) / 10
        : null;

    const dealer = await prisma.dealer.update({
      where: { id: dealerId },
      data: {
        platformRating,
        platformReviewCount,
      },
    });

    const { combinedRating } = calculateCombinedRating(dealer, settings);

    return prisma.dealer.update({
      where: { id: dealerId },
      data: { combinedRating },
    });
  }

  async recalculateAllDealers() {
    const dealers = await prisma.dealer.findMany({ select: { id: true } });
    for (const dealer of dealers) {
      await this.recalculateDealer(dealer.id);
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
