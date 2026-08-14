import { Request, Response } from "express";
import { asyncHandler } from "../middleware/asyncHandler";
import { vehicleService } from "../services/vehicle.service";

export class VehicleController {
  list = asyncHandler(async (req: Request, res: Response) => {
    const q = req.validatedQuery ?? {};
    const result = await vehicleService.list({
      make: q.make,
      model: q.model,
      year: q.year,
      yearFrom: q.yearFrom,
      yearTo: q.yearTo,
      maxPrice: q.maxPrice ?? q.priceTo,
      priceFrom: q.priceFrom,
      priceTo: q.priceTo,
      maxMileage: q.maxMileage,
      bodyStyle: q.bodyStyle,
      condition: q.condition,
      dealerSlug: q.dealerSlug,
      state: q.state,
      city: q.city,
      query: q.query ?? q.search,
      sort: q.sort,
      page: q.page,
      pageSize: q.pageSize,
    });
    res.json(result);
  });

  featured = asyncHandler(async (req: Request, res: Response) => {
    const q = req.validatedQuery ?? {};
    const data = await vehicleService.featured(q.limit ?? 6, {
      city: q.city,
      state: q.state,
    });
    res.json({ data });
  });

  byDealer = asyncHandler(async (req: Request, res: Response) => {
    const { slug } = req.validatedParams!;
    const result = await vehicleService.listByDealerSlug(slug);
    res.json(result);
  });

  getById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.validatedParams!;
    const result = await vehicleService.getById(id);
    res.json(result);
  });

  sitemap = asyncHandler(async (_req: Request, res: Response) => {
    const data = await vehicleService.sitemapEntries();
    res.json({ data });
  });
}

export const vehicleController = new VehicleController();
