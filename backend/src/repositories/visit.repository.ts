import { prisma } from "../lib/prisma";

export const visitRepository = {
  create(data: { city: string; stateCode: string; path?: string }) {
    return prisma.visitorLocation.create({ data });
  },

  count() {
    return prisma.visitorLocation.count();
  },

  async byState() {
    const rows = await prisma.visitorLocation.groupBy({
      by: ["stateCode"],
      _count: { _all: true },
      orderBy: { _count: { stateCode: "desc" } },
    });
    return rows.map((r) => ({ stateCode: r.stateCode, count: r._count._all }));
  },

  async topCities(limit: number) {
    const rows = await prisma.visitorLocation.groupBy({
      by: ["city", "stateCode"],
      _count: { _all: true },
      orderBy: { _count: { city: "desc" } },
      take: limit,
    });
    return rows.map((r) => ({
      city: r.city,
      stateCode: r.stateCode,
      count: r._count._all,
    }));
  },

  recent(limit: number) {
    return prisma.visitorLocation.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      select: { city: true, stateCode: true, path: true, createdAt: true },
    });
  },
};
