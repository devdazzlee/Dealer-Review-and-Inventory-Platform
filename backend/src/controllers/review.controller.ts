import { Request, Response } from "express";
import { asyncHandler } from "../middleware/asyncHandler";
import { reviewService } from "../services/review.service";
import { getClientIp } from "../utils/client-ip";
import type { ReviewSort } from "../config/constants";

export class ReviewController {
  submit = asyncHandler(async (req: Request, res: Response) => {
    const body = req.validatedBody!;
    const result = await reviewService.submit(body, getClientIp(req));
    res.status(201).json(result);
  });

  listByDealer = asyncHandler(async (req: Request, res: Response) => {
    const { slug } = req.validatedParams!;
    const query = req.validatedQuery!;
    const result = await reviewService.listApproved(slug, {
      page: query.page,
      sort: query.sort as ReviewSort,
    });
    res.json(result);
  });

  statsByDealer = asyncHandler(async (req: Request, res: Response) => {
    const { slug } = req.validatedParams!;
    const stats = await reviewService.getStats(slug);
    res.json(stats);
  });

  toggleHelpful = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.validatedParams!;
    const { helpful } = req.validatedBody!;
    const result = await reviewService.toggleHelpful(
      id,
      helpful,
      getClientIp(req)
    );
    res.json(result);
  });

  report = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.validatedParams!;
    const { reason } = req.validatedBody!;
    const result = await reviewService.reportReview(
      id,
      reason,
      getClientIp(req)
    );
    res.json(result);
  });
}

export const reviewController = new ReviewController();
