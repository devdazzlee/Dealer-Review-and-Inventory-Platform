import { Router, Request, Response, NextFunction } from "express";
import { reviewController } from "../controllers/review.controller";
import { validate } from "../middleware/validate";
import {
  helpfulBodySchema,
  reportReviewBodySchema,
  reviewIdParamSchema,
  submitReviewBodySchema,
} from "../validators/review.validator";

const router = Router();

/**
 * Honeypot short-circuit: bots that fill the hidden field get a fake success
 * before validation or persistence runs.
 */
function rejectHoneypot(req: Request, res: Response, next: NextFunction) {
  const website = (req.body as { website?: string } | undefined)?.website;
  if (typeof website === "string" && website.trim().length > 0) {
    res.status(201).json({
      success: true,
      message: "Review submitted for approval.",
    });
    return;
  }
  next();
}

router.post(
  "/",
  rejectHoneypot,
  validate(submitReviewBodySchema, "body"),
  reviewController.submit
);

router.post(
  "/:id/helpful",
  validate(reviewIdParamSchema, "params"),
  validate(helpfulBodySchema, "body"),
  reviewController.toggleHelpful
);

router.post(
  "/:id/report",
  validate(reviewIdParamSchema, "params"),
  validate(reportReviewBodySchema, "body"),
  reviewController.report
);

export default router;
