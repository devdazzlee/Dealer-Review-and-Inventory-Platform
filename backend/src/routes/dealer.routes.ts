import { Router } from "express";
import { dealerController } from "../controllers/dealer.controller";
import { reviewController } from "../controllers/review.controller";
import { validate } from "../middleware/validate";
import {
  createDealerBodySchema,
  dealerSlugParamSchema,
  listDealersQuerySchema,
} from "../validators/dealer.validator";
import { dealerReviewsQuerySchema } from "../validators/review.validator";

const router = Router();

router.get(
  "/",
  validate(listDealersQuerySchema, "query"),
  dealerController.list
);

router.get(
  "/:slug/reviews",
  validate(dealerSlugParamSchema, "params"),
  validate(dealerReviewsQuerySchema, "query"),
  reviewController.listByDealer
);

router.get(
  "/:slug/review-stats",
  validate(dealerSlugParamSchema, "params"),
  reviewController.statsByDealer
);

router.get(
  "/:slug",
  validate(dealerSlugParamSchema, "params"),
  dealerController.getBySlug
);

router.post(
  "/",
  validate(createDealerBodySchema, "body"),
  dealerController.create
);

export default router;
