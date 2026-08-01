import { REVIEW_STATUS, REVIEW_IP_RATE_LIMIT, REVIEW_MIN_FORM_SECONDS, ReviewSort } from "../config/constants";
import {
  ConflictError,
  NotFoundError,
  RateLimitError,
  ValidationError,
} from "../errors/AppError";
import { reviewRepository } from "../repositories/review.repository";
import { dealerRepository } from "../repositories/dealer.repository";
import { ratingService } from "./rating.service";
import { emailService } from "./email.service";
import { containsProfanity } from "../utils/profanity";
import {
  authorInitials,
  formatAuthorDisplayName,
} from "../utils/author-display";
import type { SubmitReviewInput } from "../validators/review.validator";

export class ReviewService {
  async submit(input: SubmitReviewInput, ipAddress: string) {
    // Honeypot: bots fill this; humans leave it empty. Reject silently.
    if (input.website?.trim()) {
      return { success: true, message: "Review submitted for approval." };
    }

    if (input.formOpenMs < REVIEW_MIN_FORM_SECONDS * 1000) {
      throw new ValidationError(
        "Please take a moment to complete the form before submitting."
      );
    }

    if (containsProfanity(input.title) || containsProfanity(input.comment)) {
      throw new ValidationError(
        "Your review contains language that is not allowed. Please revise and try again."
      );
    }

    const dealer = await dealerRepository.findBySlug(input.dealerSlug);
    if (!dealer) {
      throw new NotFoundError("Dealer");
    }

    const email = input.email.trim().toLowerCase();
    const duplicate = await reviewRepository.findDuplicate(email, dealer.id);
    if (duplicate) {
      throw new ConflictError(
        "You have already submitted a review for this dealer with this email address."
      );
    }

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentCount = await reviewRepository.countRecentByIp(
      ipAddress,
      oneHourAgo
    );
    if (recentCount >= REVIEW_IP_RATE_LIMIT) {
      throw new RateLimitError(
        "Too many reviews submitted from your network. Please try again later."
      );
    }

    const review = await reviewRepository.create({
      dealer: { connect: { id: dealer.id } },
      authorName: input.authorName.trim(),
      email,
      overallRating: input.overallRating,
      customerServiceRating: input.customerServiceRating ?? null,
      qualityRating: input.qualityRating ?? null,
      friendlinessRating: input.friendlinessRating ?? null,
      pricingRating: input.pricingRating ?? null,
      recommend: input.recommend ?? null,
      title: input.title.trim(),
      comment: input.comment.trim(),
      visitDate: input.visitDate ? new Date(input.visitDate) : null,
      visitType: input.visitType || null,
      status: REVIEW_STATUS.pending,
      ipAddress,
    });

    const emailCtx = {
      dealerName: dealer.name,
      dealerSlug: dealer.slug,
      authorName: input.authorName.trim(),
      overallRating: input.overallRating,
      title: input.title.trim(),
      comment: input.comment.trim(),
      reviewerEmail: email,
    };

    // Fire-and-forget emails — do not block the response on SMTP.
    void Promise.allSettled([
      emailService.sendReviewSubmittedConfirmation(emailCtx),
      emailService.sendNewReviewAdminNotification(emailCtx),
    ]).then((results) => {
      for (const result of results) {
        if (result.status === "rejected") {
          console.error("[email] failed:", result.reason);
        }
      }
    });

    return {
      success: true,
      message: "Thank you! Your review has been submitted and is pending approval.",
      id: review.id,
    };
  }

  async listApproved(
    slug: string,
    options: { page: number; sort?: ReviewSort }
  ) {
    const result = await reviewRepository.findApprovedByDealerSlug(slug, options);
    if (!result) throw new NotFoundError("Dealer");

    return {
      reviews: result.reviews.map((r) => ({
        id: r.id,
        authorName: formatAuthorDisplayName(r.authorName),
        initials: authorInitials(r.authorName),
        overallRating: r.overallRating,
        customerServiceRating: r.customerServiceRating,
        qualityRating: r.qualityRating,
        friendlinessRating: r.friendlinessRating,
        pricingRating: r.pricingRating,
        recommend: r.recommend,
        title: r.title,
        comment: r.comment,
        visitType: r.visitType,
        visitDate: r.visitDate,
        helpfulCount: r.helpfulCount,
        notHelpfulCount: r.notHelpfulCount,
        createdAt: r.createdAt,
      })),
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
      hasMore: result.hasMore,
    };
  }

  async getStats(slug: string) {
    const stats = await reviewRepository.getReviewStats(slug);
    if (!stats) throw new NotFoundError("Dealer");
    return stats;
  }

  async toggleHelpful(reviewId: string, helpful: boolean, ipAddress: string) {
    const review = await reviewRepository.findById(reviewId);
    if (!review || review.status !== REVIEW_STATUS.approved) {
      throw new NotFoundError("Review");
    }

    return reviewRepository.upsertHelpfulVote(reviewId, ipAddress, helpful);
  }

  async reportReview(
    reviewId: string,
    reason: string,
    ipAddress: string
  ) {
    const review = await reviewRepository.findById(reviewId);
    if (!review || review.status !== REVIEW_STATUS.approved) {
      throw new NotFoundError("Review");
    }

    const existing = await reviewRepository.findExistingReport(
      reviewId,
      ipAddress
    );
    if (existing) {
      return {
        success: true,
        message: "Thanks — we already received your report for this review.",
      };
    }

    await reviewRepository.createReport({
      reviewId,
      reason,
      ipAddress,
    });

    void emailService
      .sendReviewReportNotification({
        reviewId: review.id,
        dealerName: review.dealer.name,
        dealerSlug: review.dealer.slug,
        authorName: review.authorName,
        title: review.title,
        comment: review.comment,
        reason,
        reporterIp: ipAddress,
      })
      .catch((err) => console.error("[email] report failed", err));

    return {
      success: true,
      message: "Thanks — we received your report and will review it shortly.",
    };
  }
}

export const reviewService = new ReviewService();
