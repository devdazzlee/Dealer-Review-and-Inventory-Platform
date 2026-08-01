import { Router } from "express";
import { adminController } from "../controllers/admin.controller";
import { requireAdmin } from "../middleware/adminAuth";
import { validate } from "../middleware/validate";
import {
  adminBulkReviewsBodySchema,
  adminCreateDealerBodySchema,
  adminDealerIdParamSchema,
  adminDealersQuerySchema,
  adminLoginBodySchema,
  adminReportIdParamSchema,
  adminReportsQuerySchema,
  adminReviewActionBodySchema,
  adminReviewsQuerySchema,
  adminUpdateDealerBodySchema,
  assignBadgeBodySchema,
  ratingSettingsBodySchema,
} from "../validators/admin.validator";
import { reviewIdParamSchema } from "../validators/review.validator";

const router = Router();

router.post(
  "/login",
  validate(adminLoginBodySchema, "body"),
  adminController.login
);

router.use(requireAdmin);

router.get("/dashboard", adminController.dashboard);

router.get(
  "/reviews",
  validate(adminReviewsQuerySchema, "query"),
  adminController.listReviews
);

router.put(
  "/reviews/:id",
  validate(reviewIdParamSchema, "params"),
  validate(adminReviewActionBodySchema, "body"),
  adminController.reviewAction
);

router.post(
  "/reviews/bulk",
  validate(adminBulkReviewsBodySchema, "body"),
  adminController.bulkReviews
);

router.get(
  "/reports",
  validate(adminReportsQuerySchema, "query"),
  adminController.listReports
);

router.post(
  "/reports/:id/resolve",
  validate(adminReportIdParamSchema, "params"),
  adminController.resolveReport
);

router.get(
  "/dealers",
  validate(adminDealersQuerySchema, "query"),
  adminController.listDealers
);

router.get("/dealers/select", adminController.dealersForSelect);

router.post(
  "/dealers",
  validate(adminCreateDealerBodySchema, "body"),
  adminController.createDealer
);

router.put(
  "/dealers/:id",
  validate(adminDealerIdParamSchema, "params"),
  validate(adminUpdateDealerBodySchema, "body"),
  adminController.updateDealer
);

router.delete(
  "/dealers/:id",
  validate(adminDealerIdParamSchema, "params"),
  adminController.deleteDealer
);

router.get(
  "/dealers/:id/rating-preview",
  validate(adminDealerIdParamSchema, "params"),
  adminController.ratingPreview
);

router.get("/rating-settings", adminController.getRatingSettings);

router.put(
  "/rating-settings",
  validate(ratingSettingsBodySchema, "body"),
  adminController.updateRatingSettings
);

router.get("/badges", adminController.listBadgedDealers);

router.post(
  "/badges/assign",
  validate(assignBadgeBodySchema, "body"),
  adminController.assignBadge
);

router.post(
  "/badges/:id/revoke",
  validate(adminDealerIdParamSchema, "params"),
  adminController.revokeBadge
);

export default router;
