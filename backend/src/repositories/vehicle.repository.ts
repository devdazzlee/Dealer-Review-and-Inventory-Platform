import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";

export interface VehicleListQuery {
  make?: string;
  model?: string;
  year?: number;
  yearFrom?: number;
  yearTo?: number;
  maxPrice?: number;
  priceFrom?: number;
  priceTo?: number;
  maxMileage?: number;
  bodyStyle?: string;
  condition?: string;
  dealerSlug?: string;
  state?: string;
  city?: string;
  query?: string;
  sort?: string;
  page?: number;
  pageSize?: number;
}

const vehicleInclude = {
  dealer: true,
} satisfies Prisma.VehicleInclude;

export type VehicleWithDealer = Prisma.VehicleGetPayload<{
  include: typeof vehicleInclude;
}>;

function featuredFirstOrder(
  extra: Prisma.VehicleOrderByWithRelationInput[]
): Prisma.VehicleOrderByWithRelationInput[] {
  return [{ dealer: { featured: "desc" } }, ...extra];
}

export class VehicleRepository {
  private buildWhere(query: VehicleListQuery): Prisma.VehicleWhereInput {
    const where: Prisma.VehicleWhereInput = { isActive: true };

    if (query.make) {
      // Supports a comma-separated list (e.g. for a "Luxury" meta-category
      // that maps to several real makes) alongside the existing single-value case.
      const makes = query.make.split(",").map((m) => m.trim()).filter(Boolean);
      where.make = makes.length > 1 ? { in: makes } : makes[0];
    }
    if (query.model) {
      where.model = { contains: query.model, mode: "insensitive" };
    }
    if (query.year) where.year = query.year;
    if (query.yearFrom || query.yearTo) {
      where.year = {
        gte: query.yearFrom,
        lte: query.yearTo,
      };
    }
    if (query.maxPrice != null || query.priceFrom != null || query.priceTo != null) {
      where.price = {
        gte: query.priceFrom,
        lte: query.maxPrice ?? query.priceTo,
      };
    }
    if (query.maxMileage != null) {
      where.mileage = { lte: query.maxMileage };
    }
    if (query.bodyStyle) where.bodyStyle = query.bodyStyle;
    if (query.condition) where.condition = query.condition;
    if (query.dealerSlug) where.dealer = { slug: query.dealerSlug };
    if (query.state) where.dealer = { ...(where.dealer as object), state: query.state.toUpperCase() };
    if (query.city) {
      where.dealer = {
        ...(where.dealer as object),
        city: { contains: query.city, mode: "insensitive" },
      };
    }
    if (query.query) {
      const q = query.query;
      where.OR = [
        { make: { contains: q, mode: "insensitive" } },
        { model: { contains: q, mode: "insensitive" } },
        { trim: { contains: q, mode: "insensitive" } },
        { dealer: { name: { contains: q, mode: "insensitive" } } },
      ];
    }

    return where;
  }

  async findMany(query: VehicleListQuery): Promise<{
    vehicles: VehicleWithDealer[];
    total: number;
  }> {
    const where = this.buildWhere(query);
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    const [total, vehicles] = await Promise.all([
      prisma.vehicle.count({ where }),
      prisma.vehicle.findMany({
        where,
        include: vehicleInclude,
        orderBy: this.orderBy(query.sort),
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return { vehicles, total };
  }

  /** Real inventory counts per city, for the homepage "Top cities" list —
   * replaces what used to be a hardcoded, stale-looking number. Small
   * enough dataset (low thousands of active vehicles at most) that
   * aggregating in JS after one query is simpler and just as fast as a
   * raw-SQL group-by across the dealer relation. */
  async topCitiesByInventory(
    limit: number
  ): Promise<{ city: string; stateCode: string; count: number }[]> {
    const vehicles = await prisma.vehicle.findMany({
      where: { isActive: true },
      select: { dealer: { select: { city: true, state: true } } },
    });

    const counts = new Map<string, { city: string; stateCode: string; count: number }>();
    for (const { dealer } of vehicles) {
      const key = `${dealer.city}|${dealer.state}`;
      const existing = counts.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        counts.set(key, { city: dealer.city, stateCode: dealer.state, count: 1 });
      }
    }

    return [...counts.values()]
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  async findAllActive(): Promise<VehicleWithDealer[]> {
    return prisma.vehicle.findMany({
      where: { isActive: true },
      include: vehicleInclude,
      orderBy: featuredFirstOrder([{ updatedAt: "desc" }]),
    });
  }

  async findById(id: string): Promise<VehicleWithDealer | null> {
    return prisma.vehicle.findFirst({
      where: { OR: [{ id }, { vin: id }], isActive: true },
      include: vehicleInclude,
    });
  }

  /**
   * Resolves the SEO-friendly detail URL: dealer slug scopes the search, and
   * the trailing short id (see utils/vehicle-slug.ts) is the actual lookup
   * key — the descriptive year/make/model/trim prefix is display-only and
   * never validated, so a stale indexed URL still finds the right vehicle.
   */
  async findBySlug(
    dealerSlug: string,
    shortId: string
  ): Promise<VehicleWithDealer | null> {
    return prisma.vehicle.findFirst({
      where: {
        isActive: true,
        dealer: { slug: dealerSlug },
        id: { endsWith: shortId },
      },
      include: vehicleInclude,
    });
  }

  async findByDealerSlug(slug: string): Promise<VehicleWithDealer[]> {
    const vehicles = await prisma.vehicle.findMany({
      where: { isActive: true, dealer: { slug } },
      include: vehicleInclude,
      orderBy: [{ updatedAt: "desc" }],
    });
    return vehicles;
  }

  async findSimilar(vehicle: VehicleWithDealer, limit: number): Promise<VehicleWithDealer[]> {
    return prisma.vehicle.findMany({
      where: {
        isActive: true,
        id: { not: vehicle.id },
        OR: [
          { dealerId: vehicle.dealerId },
          { make: vehicle.make, bodyStyle: vehicle.bodyStyle },
        ],
      },
      include: vehicleInclude,
      take: limit,
      orderBy: featuredFirstOrder([{ updatedAt: "desc" }]),
    });
  }

  private orderBy(
    sort?: string
  ): Prisma.VehicleOrderByWithRelationInput[] {
    switch (sort) {
      case "price-asc":
        return featuredFirstOrder([{ price: "asc" }, { updatedAt: "desc" }]);
      case "price-desc":
        return featuredFirstOrder([{ price: "desc" }, { updatedAt: "desc" }]);
      case "newest":
        return featuredFirstOrder([{ year: "desc" }, { updatedAt: "desc" }]);
      case "rating":
        return featuredFirstOrder([
          { dealer: { combinedRating: "desc" } },
          { updatedAt: "desc" },
        ]);
      default:
        return featuredFirstOrder([{ updatedAt: "desc" }]);
    }
  }
}

export const vehicleRepository = new VehicleRepository();
