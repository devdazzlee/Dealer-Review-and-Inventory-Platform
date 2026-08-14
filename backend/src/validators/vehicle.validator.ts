import { z } from "zod";

const optionalNumber = z.preprocess(
  (v) => (v === undefined || v === "" ? undefined : Number(v)),
  z.number().optional()
);

const optionalInt = z.preprocess(
  (v) => (v === undefined || v === "" ? undefined : Number(v)),
  z.number().int().optional()
);

export const vehicleListQuerySchema = z.object({
  make: z.string().trim().optional(),
  model: z.string().trim().optional(),
  year: optionalInt,
  yearFrom: optionalInt,
  yearTo: optionalInt,
  maxPrice: optionalNumber,
  priceFrom: optionalNumber,
  priceTo: optionalNumber,
  maxMileage: optionalInt,
  bodyStyle: z.string().trim().optional(),
  condition: z.string().trim().optional(),
  dealerSlug: z.string().trim().optional(),
  state: z.string().trim().optional(),
  city: z.string().trim().optional(),
  query: z.string().trim().optional(),
  search: z.string().trim().optional(),
  sort: z.string().trim().optional(),
  page: z.preprocess(
    (v) => (v === undefined || v === "" ? 1 : Number(v)),
    z.number().int().min(1).default(1)
  ),
  pageSize: z.preprocess(
    (v) => (v === undefined || v === "" ? 20 : Number(v)),
    z.number().int().min(1).max(100).default(20)
  ),
});

export const vehicleFeaturedQuerySchema = z.object({
  limit: z.preprocess(
    (v) => (v === undefined || v === "" ? 6 : Number(v)),
    z.number().int().min(1).max(24).default(6)
  ),
  city: z.string().trim().optional(),
  state: z.string().trim().optional(),
});

export const vehicleIdParamSchema = z.object({
  id: z.string().min(1),
});

export const dealerSlugParamSchema = z.object({
  slug: z.string().min(1),
});
