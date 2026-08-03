import { REVIEW_STATUS } from "../config/constants";
import { NotFoundError, ValidationError } from "../errors/AppError";
import { reviewRepository } from "../repositories/review.repository";
import { dealerRepository } from "../repositories/dealer.repository";
import { ratingService } from "./rating.service";
import { emailService } from "./email.service";
import { dealerService } from "./dealer.service";
import { toDealerSummaryDto } from "../dtos/dealer.dto";

export class AdminService {
  async dashboard() {
    const [
      dealerCount,
      featuredCount,
      badgedCount,
      reviewCounts,
      recent,
      reportCounts,
    ] = await Promise.all([
      dealerRepository.count(),
      dealerRepository.countFeatured(),
      dealerRepository.countBadged(),
      reviewRepository.countByStatus(),
      reviewRepository.recentActivity(12),
      reviewRepository.countReportsByStatus(),
    ]);

    return {
      dealers: dealerCount,
      dealersFeatured: featuredCount,
      dealersBadged: badgedCount,
      reviews: reviewCounts,
      reports: reportCounts,
      pendingUrgent: reviewCounts.pending > 5,
      recentActivity: recent.map((r) => ({
        id: r.id,
        type: "review" as const,
        status: r.status,
        authorName: r.authorName,
        title: r.title,
        overallRating: r.overallRating,
        dealerName: r.dealer.name,
        dealerSlug: r.dealer.slug,
        createdAt: r.createdAt,
      })),
    };
  }

  async listReviews(options: {
    status?: string;
    search?: string;
    dealerId?: string;
    rating?: number;
    page: number;
  }) {
    return reviewRepository.findAdminList(options);
  }

  async reviewAction(id: string, action: "approve" | "reject" | "delete") {
    const existing = await reviewRepository.findById(id);
    if (!existing) throw new NotFoundError("Review");

    if (action === "delete") {
      const deleted = await reviewRepository.delete(id);
      await ratingService.recalculateDealer(deleted.dealerId);
      return { success: true, action: "delete" as const };
    }

    const status =
      action === "approve" ? REVIEW_STATUS.approved : REVIEW_STATUS.rejected;
    const updated = await reviewRepository.updateStatus(id, status);
    await ratingService.recalculateDealer(updated.dealerId);

    if (action === "approve" && existing.status !== REVIEW_STATUS.approved) {
      void emailService
        .sendReviewApprovedNotification({
          dealerName: updated.dealer.name,
          dealerSlug: updated.dealer.slug,
          authorName: updated.authorName,
          overallRating: updated.overallRating,
          title: updated.title,
          comment: updated.comment,
          reviewerEmail: updated.email,
        })
        .catch((err) => console.error("[email] approve notify failed:", err));
    }

    return { success: true, action, review: updated };
  }

  async bulkReviewAction(
    ids: string[],
    action: "approve" | "reject" | "delete"
  ) {
    if (ids.length === 0) {
      throw new ValidationError("Select at least one review");
    }

    const reviews = await reviewRepository.findManyByIds(ids);
    const dealerIds = new Set(reviews.map((r) => r.dealerId));

    if (action === "delete") {
      await reviewRepository.bulkDelete(ids);
    } else {
      const status =
        action === "approve" ? REVIEW_STATUS.approved : REVIEW_STATUS.rejected;
      await reviewRepository.bulkUpdateStatus(ids, status);

      if (action === "approve") {
        for (const review of reviews) {
          if (review.status === REVIEW_STATUS.approved) continue;
          void emailService
            .sendReviewApprovedNotification({
              dealerName: review.dealer.name,
              dealerSlug: review.dealer.slug,
              authorName: review.authorName,
              overallRating: review.overallRating,
              title: review.title,
              comment: review.comment,
              reviewerEmail: review.email,
            })
            .catch((err) =>
              console.error("[email] bulk approve notify failed:", err)
            );
        }
      }
    }

    for (const dealerId of dealerIds) {
      await ratingService.recalculateDealer(dealerId);
    }

    return { success: true, action, count: ids.length };
  }

  async getRatingSettings() {
    return ratingService.getSettings();
  }

  async updateRatingSettings(
    data: Parameters<typeof ratingService.updateSettings>[0]
  ) {
    return ratingService.updateSettings(data);
  }

  async ratingSettingsImpactPreview() {
    const settings = await ratingService.getSettings();
    const sample = await dealerRepository.findAdminList({
      page: 1,
      pageSize: 5,
    });
    return {
      settings,
      sample: sample.dealers.map((d) => ({
        id: d.id,
        name: d.name,
        preview: ratingService.previewCombined(d, settings),
        current: toDealerSummaryDto(d, settings),
      })),
    };
  }

  async assignBadge(dealerId: string, badgeYear: number) {
    return dealerService.adminUpdate(dealerId, {
      hasBadge: true,
      badgeYear,
    });
  }

  async revokeBadge(dealerId: string) {
    return dealerService.adminUpdate(dealerId, {
      hasBadge: false,
      badgeYear: null,
    });
  }

  async listReports(options: {
    status?: "open" | "resolved" | "all";
    search?: string;
    page: number;
  }) {
    const result = await reviewRepository.findReports(options);
    return {
      ...result,
      reports: result.reports.map((r) => ({
        id: r.id,
        reason: r.reason,
        status: r.status,
        createdAt: r.createdAt,
        resolvedAt: r.resolvedAt,
        review: {
          id: r.review.id,
          authorName: r.review.authorName,
          title: r.review.title,
          comment: r.review.comment,
          overallRating: r.review.overallRating,
          status: r.review.status,
          dealer: r.review.dealer,
        },
      })),
    };
  }

  async resolveReport(id: string) {
    const existing = await reviewRepository.findReportById(id);
    if (!existing) throw new NotFoundError("Report");
    if (existing.status === "resolved") {
      return existing;
    }
    return reviewRepository.resolveReport(id);
  }
}

export const adminService = new AdminService();
