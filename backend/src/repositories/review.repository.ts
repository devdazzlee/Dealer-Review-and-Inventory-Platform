import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import {
  ADMIN_REVIEW_PAGE_SIZE,
  REVIEW_PAGE_SIZE,
  REVIEW_SORT,
  REVIEW_STATUS,
  ReviewSort,
} from "../config/constants";
import {
  DealerListFilters,
  DealerWithRatingFields,
} from "../types/dealer.types";

export class ReviewRepository {
  async findApprovedByDealerSlug(
    slug: string,
    options: {
      page: number;
      pageSize?: number;
      sort?: ReviewSort;
    }
  ) {
    const pageSize = options.pageSize ?? REVIEW_PAGE_SIZE;
    const page = Math.max(1, options.page);
    const sort = options.sort ?? REVIEW_SORT.recent;

    const dealer = await prisma.dealer.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!dealer) return null;

    const orderBy: Prisma.ReviewOrderByWithRelationInput =
      sort === REVIEW_SORT.highest
        ? { overallRating: "desc" }
        : sort === REVIEW_SORT.lowest
          ? { overallRating: "asc" }
          : { createdAt: "desc" };

    const where = {
      dealerId: dealer.id,
      status: REVIEW_STATUS.approved,
    };

    const [total, reviews] = await Promise.all([
      prisma.review.count({ where }),
      prisma.review.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return {
      dealerId: dealer.id,
      reviews,
      total,
      page,
      pageSize,
      hasMore: page * pageSize < total,
    };
  }

  async getReviewStats(slug: string) {
    const dealer = await prisma.dealer.findUnique({
      where: { slug },
      select: {
        id: true,
        platformRating: true,
        platformReviewCount: true,
      },
    });
    if (!dealer) return null;

    const approved = await prisma.review.findMany({
      where: { dealerId: dealer.id, status: REVIEW_STATUS.approved },
      select: {
        overallRating: true,
        customerServiceRating: true,
        qualityRating: true,
        friendlinessRating: true,
        pricingRating: true,
      },
    });

    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    let customerServiceSum = 0;
    let customerServiceCount = 0;
    let qualitySum = 0;
    let qualityCount = 0;
    let friendlinessSum = 0;
    let friendlinessCount = 0;
    let pricingSum = 0;
    let pricingCount = 0;

    for (const review of approved) {
      const star = review.overallRating as 1 | 2 | 3 | 4 | 5;
      if (star >= 1 && star <= 5) distribution[star] += 1;

      if (review.customerServiceRating != null) {
        customerServiceSum += review.customerServiceRating;
        customerServiceCount += 1;
      }
      if (review.qualityRating != null) {
        qualitySum += review.qualityRating;
        qualityCount += 1;
      }
      if (review.friendlinessRating != null) {
        friendlinessSum += review.friendlinessRating;
        friendlinessCount += 1;
      }
      if (review.pricingRating != null) {
        pricingSum += review.pricingRating;
        pricingCount += 1;
      }
    }

    const total = approved.length;
    const avg = (sum: number, count: number) =>
      count > 0 ? Math.round((sum / count) * 10) / 10 : null;

    return {
      totalReviews: total,
      averageRating: dealer.platformRating,
      distribution: ([5, 4, 3, 2, 1] as const).map((stars) => ({
        stars,
        count: distribution[stars],
        percentage: total > 0 ? Math.round((distribution[stars] / total) * 100) : 0,
      })),
      categoryAverages: {
        customerService: avg(customerServiceSum, customerServiceCount),
        quality: avg(qualitySum, qualityCount),
        friendliness: avg(friendlinessSum, friendlinessCount),
        pricing: avg(pricingSum, pricingCount),
      },
    };
  }

  async findDuplicate(email: string, dealerId: string) {
    return prisma.review.findFirst({
      where: {
        email: { equals: email, mode: "insensitive" },
        dealerId,
      },
    });
  }

  async countRecentByIp(ipAddress: string, since: Date) {
    return prisma.review.count({
      where: {
        ipAddress,
        createdAt: { gte: since },
      },
    });
  }

  async create(data: Prisma.ReviewCreateInput) {
    return prisma.review.create({ data });
  }

  async findById(id: string) {
    return prisma.review.findUnique({
      where: { id },
      include: { dealer: true },
    });
  }

  async updateStatus(id: string, status: string) {
    return prisma.review.update({
      where: { id },
      data: { status },
      include: { dealer: true },
    });
  }

  async delete(id: string) {
    return prisma.review.delete({
      where: { id },
      include: { dealer: true },
    });
  }

  async findAdminList(options: {
    status?: string;
    search?: string;
    dealerId?: string;
    rating?: number;
    page: number;
    pageSize?: number;
  }) {
    const pageSize = options.pageSize ?? ADMIN_REVIEW_PAGE_SIZE;
    const page = Math.max(1, options.page);

    const where: Prisma.ReviewWhereInput = {};
    if (options.status && options.status !== "all") {
      where.status = options.status;
    }
    if (options.dealerId) {
      where.dealerId = options.dealerId;
    }
    if (options.rating) {
      where.overallRating = options.rating;
    }
    if (options.search?.trim()) {
      const q = options.search.trim();
      where.OR = [
        { authorName: { contains: q, mode: "insensitive" } },
        { dealer: { name: { contains: q, mode: "insensitive" } } },
        { title: { contains: q, mode: "insensitive" } },
      ];
    }

    const [total, reviews] = await Promise.all([
      prisma.review.count({ where }),
      prisma.review.findMany({
        where,
        include: {
          dealer: { select: { id: true, name: true, slug: true } },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return { reviews, total, page, pageSize };
  }

  async countByStatus() {
    const groups = await prisma.review.groupBy({
      by: ["status"],
      _count: { id: true },
    });
    const counts = { pending: 0, approved: 0, rejected: 0, total: 0 };
    for (const g of groups) {
      const n = g._count.id;
      counts.total += n;
      if (g.status === REVIEW_STATUS.pending) counts.pending = n;
      else if (g.status === REVIEW_STATUS.approved) counts.approved = n;
      else if (g.status === REVIEW_STATUS.rejected) counts.rejected = n;
    }
    return counts;
  }

  async findHelpfulVote(reviewId: string, visitorId: string) {
    return prisma.reviewHelpful.findUnique({
      where: { reviewId_visitorId: { reviewId, visitorId } },
    });
  }

  async upsertHelpfulVote(
    reviewId: string,
    visitorId: string,
    helpful: boolean
  ) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.reviewHelpful.findUnique({
        where: { reviewId_visitorId: { reviewId, visitorId } },
      });

      if (existing && existing.helpful === helpful) {
        // Toggle off — remove vote
        await tx.reviewHelpful.delete({
          where: { id: existing.id },
        });
        const review = await tx.review.update({
          where: { id: reviewId },
          data: helpful
            ? { helpfulCount: { decrement: 1 } }
            : { notHelpfulCount: { decrement: 1 } },
        });
        return {
          helpfulCount: Math.max(0, review.helpfulCount),
          notHelpfulCount: Math.max(0, review.notHelpfulCount),
          userVote: null as boolean | null,
        };
      }

      if (existing) {
        // Switch vote direction
        await tx.reviewHelpful.update({
          where: { id: existing.id },
          data: { helpful },
        });
        const review = await tx.review.update({
          where: { id: reviewId },
          data: helpful
            ? {
                helpfulCount: { increment: 1 },
                notHelpfulCount: { decrement: 1 },
              }
            : {
                helpfulCount: { decrement: 1 },
                notHelpfulCount: { increment: 1 },
              },
        });
        return {
          helpfulCount: Math.max(0, review.helpfulCount),
          notHelpfulCount: Math.max(0, review.notHelpfulCount),
          userVote: helpful,
        };
      }

      await tx.reviewHelpful.create({
        data: { reviewId, visitorId, helpful },
      });
      const review = await tx.review.update({
        where: { id: reviewId },
        data: helpful
          ? { helpfulCount: { increment: 1 } }
          : { notHelpfulCount: { increment: 1 } },
      });
      return {
        helpfulCount: review.helpfulCount,
        notHelpfulCount: review.notHelpfulCount,
        userVote: helpful,
      };
    });
  }

  async bulkUpdateStatus(ids: string[], status: string) {
    return prisma.review.updateMany({
      where: { id: { in: ids } },
      data: { status },
    });
  }

  async bulkDelete(ids: string[]) {
    return prisma.review.deleteMany({
      where: { id: { in: ids } },
    });
  }

  async findManyByIds(ids: string[]) {
    return prisma.review.findMany({
      where: { id: { in: ids } },
      include: { dealer: true },
    });
  }

  async recentActivity(limit = 10) {
    return prisma.review.findMany({
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        dealer: { select: { name: true, slug: true } },
      },
    });
  }

  async findExistingReport(reviewId: string, ipAddress: string) {
    return prisma.reviewReport.findUnique({
      where: {
        reviewId_ipAddress: { reviewId, ipAddress },
      },
    });
  }

  async createReport(input: {
    reviewId: string;
    reason: string;
    ipAddress: string;
  }) {
    return prisma.reviewReport.create({
      data: {
        reviewId: input.reviewId,
        reason: input.reason,
        ipAddress: input.ipAddress,
        status: "open",
      },
    });
  }

  async countReportsByStatus() {
    const [open, resolved] = await Promise.all([
      prisma.reviewReport.count({ where: { status: "open" } }),
      prisma.reviewReport.count({ where: { status: "resolved" } }),
    ]);
    return { open, resolved, total: open + resolved };
  }

  async findReports(options: {
    status?: "open" | "resolved" | "all";
    search?: string;
    page: number;
    pageSize?: number;
  }) {
    const pageSize = options.pageSize ?? 20;
    const where: Prisma.ReviewReportWhereInput =
      !options.status || options.status === "all"
        ? {}
        : { status: options.status };

    if (options.search?.trim()) {
      const q = options.search.trim();
      where.review = {
        OR: [
          { authorName: { contains: q, mode: "insensitive" } },
          { title: { contains: q, mode: "insensitive" } },
          { dealer: { name: { contains: q, mode: "insensitive" } } },
        ],
      };
    }

    const [total, reports] = await Promise.all([
      prisma.reviewReport.count({ where }),
      prisma.reviewReport.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (options.page - 1) * pageSize,
        take: pageSize,
        include: {
          review: {
            include: {
              dealer: { select: { id: true, name: true, slug: true } },
            },
          },
        },
      }),
    ]);

    return { total, page: options.page, pageSize, reports };
  }

  async findReportById(id: string) {
    return prisma.reviewReport.findUnique({
      where: { id },
      include: {
        review: {
          include: {
            dealer: { select: { id: true, name: true, slug: true } },
          },
        },
      },
    });
  }

  async resolveReport(id: string) {
    return prisma.reviewReport.update({
      where: { id },
      data: { status: "resolved", resolvedAt: new Date() },
      include: {
        review: {
          include: {
            dealer: { select: { id: true, name: true, slug: true } },
          },
        },
      },
    });
  }
}

export const reviewRepository = new ReviewRepository();

/** Featured dealers first, then name. Pinning is Dealer.featured, not a slug. */
export function sortDealersPriority<T extends { featured: boolean; name: string }>(
  dealers: T[]
): T[] {
  return [...dealers].sort((a, b) => {
    if (a.featured !== b.featured) return a.featured ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

export type { DealerWithRatingFields, DealerListFilters };
