import { Request, Response } from "express";
import { dealerService } from "../services/dealer.service";
import { asyncHandler } from "../middleware/asyncHandler";

export class DealerController {
  list = asyncHandler(async (req: Request, res: Response) => {
    const dealers = await dealerService.listDealers(req.validatedQuery ?? {});
    res.json(dealers);
  });

  countsByState = asyncHandler(async (_req: Request, res: Response) => {
    const data = await dealerService.countsByState();
    res.json({ data });
  });

  getBySlug = asyncHandler(async (req: Request, res: Response) => {
    const { slug } = req.validatedParams!;
    const dealer = await dealerService.getDealerBySlug(slug);
    res.json(dealer);
  });

  create = asyncHandler(async (req: Request, res: Response) => {
    const body = req.validatedBody!;
    const dealer = await dealerService.createDealer({
      ...body,
      email: body.email || null,
      website: body.website || null,
      logo: body.logo || null,
    });
    res.status(201).json(dealer);
  });
}

export const dealerController = new DealerController();
