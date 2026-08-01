import { Request, Response } from "express";
import { asyncHandler } from "../middleware/asyncHandler";
import { badgeService } from "../services/badge.service";

export class BadgeController {
  getData = asyncHandler(async (req: Request, res: Response) => {
    const { slug } = req.validatedParams!;
    const data = await badgeService.getBadgeData(slug);
    res.json(data);
  });

  widgetJs = asyncHandler(async (req: Request, res: Response) => {
    const { slug } = req.validatedParams!;
    const data = await badgeService.getBadgeData(slug);
    const script = badgeService.buildWidgetScript(slug, data);
    res.setHeader("Content-Type", "application/javascript; charset=utf-8");
    res.setHeader("Cache-Control", "public, max-age=300");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.send(script);
  });
}

export const badgeController = new BadgeController();
