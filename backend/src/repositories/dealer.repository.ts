import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import {
  CreateDealerInput,
  DealerListFilters,
  DealerWithRatingFields,
  UpdateDealerAdminInput,
} from "../types/dealer.types";
import { PRIORITY_DEALER_SLUG } from "../config/constants";
import { sortDealersPriority } from "./review.repository";

export class DealerRepository {
  async findAll(filters: DealerListFilters): Promise<DealerWithRatingFields[]> {
    if (filters.minRating !== undefined) {
      return this.findAllWithMinRating(filters);
    }

    const dealers = await prisma.dealer.findMany({
      where: this.buildPrismaWhere(filters),
    });

    return sortDealersPriority(dealers);
  }

  private buildPrismaWhere(
    filters: DealerListFilters
  ): Prisma.DealerWhereInput {
    const where: Prisma.DealerWhereInput = {};

    if (filters.state) {
      where.state = filters.state.toUpperCase();
    }

    if (filters.city) {
      where.city = { contains: filters.city, mode: "insensitive" };
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: "insensitive" } },
        { city: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    return where;
  }

  private async findAllWithMinRating(
    filters: DealerListFilters
  ): Promise<DealerWithRatingFields[]> {
    const state = filters.state?.toUpperCase() ?? null;
    const cityPattern = filters.city ? `%${filters.city}%` : null;
    const searchPattern = filters.search ? `%${filters.search}%` : null;
    const minRating = filters.minRating!;

    const rows = await prisma.$queryRaw<{ id: string }[]>`
      SELECT d.id
      FROM "Dealer" d
      WHERE
        (${state}::text IS NULL OR d.state = ${state})
        AND (${cityPattern}::text IS NULL OR d.city ILIKE ${cityPattern})
        AND (
          ${searchPattern}::text IS NULL
          OR d.name ILIKE ${searchPattern}
          OR d.city ILIKE ${searchPattern}
        )
        AND d."combinedRating" IS NOT NULL
        AND d."combinedRating" >= ${minRating}
      ORDER BY
        CASE WHEN d.slug = ${PRIORITY_DEALER_SLUG} THEN 0 ELSE 1 END,
        CASE WHEN d.featured THEN 0 ELSE 1 END,
        d.name ASC
    `;

    if (rows.length === 0) return [];

    const dealers = await prisma.dealer.findMany({
      where: { id: { in: rows.map((row) => row.id) } },
    });

    return sortDealersPriority(dealers);
  }

  async findBySlug(slug: string): Promise<DealerWithRatingFields | null> {
    return prisma.dealer.findUnique({ where: { slug } });
  }

  async findById(id: string): Promise<DealerWithRatingFields | null> {
    return prisma.dealer.findUnique({ where: { id } });
  }

  async slugExists(slug: string): Promise<boolean> {
    const count = await prisma.dealer.count({ where: { slug } });
    return count > 0;
  }

  async create(
    input: CreateDealerInput & { slug: string }
  ): Promise<DealerWithRatingFields> {
    return prisma.dealer.create({
      data: {
        name: input.name,
        slug: input.slug,
        address: input.address,
        city: input.city,
        state: input.state.toUpperCase(),
        zip: input.zip,
        phone: input.phone ?? null,
        email: input.email ?? null,
        website: input.website ?? null,
        description: input.description ?? null,
        logo: input.logo ?? null,
        featured: input.featured ?? false,
        googleRating: input.googleRating ?? null,
        googleReviewCount: input.googleReviewCount ?? null,
        yelpRating: input.yelpRating ?? null,
        yelpReviewCount: input.yelpReviewCount ?? null,
        carfaxRating: input.carfaxRating ?? null,
        carfaxUrl: input.carfaxUrl ?? null,
        autoSalesReviewsRating: input.autoSalesReviewsRating ?? null,
        manualRatingOverride: input.manualRatingOverride ?? null,
        useManualRating: input.useManualRating ?? false,
        hasBadge: input.hasBadge ?? false,
        badgeYear: input.badgeYear ?? null,
      },
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.dealer.delete({ where: { id } });
  }

  async updateAdmin(
    id: string,
    input: UpdateDealerAdminInput
  ): Promise<DealerWithRatingFields> {
    const data: Prisma.DealerUpdateInput = {};

    if (input.name !== undefined) data.name = input.name;
    if (input.address !== undefined) data.address = input.address;
    if (input.city !== undefined) data.city = input.city;
    if (input.state !== undefined) data.state = input.state.toUpperCase();
    if (input.zip !== undefined) data.zip = input.zip;
    if (input.phone !== undefined) data.phone = input.phone;
    if (input.email !== undefined) data.email = input.email;
    if (input.website !== undefined) data.website = input.website;
    if (input.description !== undefined) data.description = input.description;
    if (input.logo !== undefined) data.logo = input.logo;
    if (input.featured !== undefined) data.featured = input.featured;
    if (input.googleRating !== undefined) data.googleRating = input.googleRating;
    if (input.googleReviewCount !== undefined)
      data.googleReviewCount = input.googleReviewCount;
    if (input.yelpRating !== undefined) data.yelpRating = input.yelpRating;
    if (input.yelpReviewCount !== undefined)
      data.yelpReviewCount = input.yelpReviewCount;
    if (input.carfaxRating !== undefined) data.carfaxRating = input.carfaxRating;
    if (input.carfaxUrl !== undefined) data.carfaxUrl = input.carfaxUrl;
    if (input.autoSalesReviewsRating !== undefined)
      data.autoSalesReviewsRating = input.autoSalesReviewsRating;
    if (input.manualRatingOverride !== undefined)
      data.manualRatingOverride = input.manualRatingOverride;
    if (input.useManualRating !== undefined)
      data.useManualRating = input.useManualRating;
    if (input.hasBadge !== undefined) data.hasBadge = input.hasBadge;
    if (input.badgeYear !== undefined) data.badgeYear = input.badgeYear;

    return prisma.dealer.update({ where: { id }, data });
  }

  async findAdminList(options: {
    search?: string;
    featured?: boolean;
    hasBadge?: boolean;
    page: number;
    pageSize: number;
  }) {
    const where: Prisma.DealerWhereInput = {};
    if (options.search?.trim()) {
      const q = options.search.trim();
      where.OR = [
        { name: { contains: q, mode: "insensitive" } },
        { city: { contains: q, mode: "insensitive" } },
        { state: { contains: q, mode: "insensitive" } },
      ];
    }
    if (options.featured !== undefined) {
      where.featured = options.featured;
    }
    if (options.hasBadge !== undefined) {
      where.hasBadge = options.hasBadge;
    }

    const [total, dealers] = await Promise.all([
      prisma.dealer.count({ where }),
      prisma.dealer.findMany({
        where,
        orderBy: [{ name: "asc" }],
        skip: (options.page - 1) * options.pageSize,
        take: options.pageSize,
      }),
    ]);

    return {
      dealers: sortDealersPriority(dealers),
      total,
      page: options.page,
      pageSize: options.pageSize,
    };
  }

  async count() {
    return prisma.dealer.count();
  }

  async countFeatured() {
    return prisma.dealer.count({ where: { featured: true } });
  }

  async countBadged() {
    return prisma.dealer.count({ where: { hasBadge: true } });
  }

  async findBadged() {
    const dealers = await prisma.dealer.findMany({
      where: { hasBadge: true },
      orderBy: [{ badgeYear: "desc" }, { name: "asc" }],
    });
    return sortDealersPriority(dealers);
  }

  async listForSelect() {
    return prisma.dealer.findMany({
      select: { id: true, name: true, slug: true, hasBadge: true, badgeYear: true },
      orderBy: { name: "asc" },
    });
  }
}

export const dealerRepository = new DealerRepository();
