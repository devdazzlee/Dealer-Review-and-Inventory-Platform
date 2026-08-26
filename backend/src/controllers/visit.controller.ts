import { Request, Response } from "express";
import { asyncHandler } from "../middleware/asyncHandler";
import { visitService } from "../services/visit.service";

export const visitController = {
  track: asyncHandler(async (req: Request, res: Response) => {
    const { city, stateCode, path } = req.validatedBody!;
    await visitService.track({ city, stateCode, path });
    res.status(204).end();
  }),

  summary: asyncHandler(async (_req: Request, res: Response) => {
    const data = await visitService.summary();
    res.json(data);
  }),
};
