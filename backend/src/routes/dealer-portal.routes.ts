import { Router } from "express";
import { dealerPortalController } from "../controllers/dealer-portal.controller";
import { requireDealer } from "../middleware/dealerAuth";
import { uploadImage } from "../middleware/upload";
import { validate } from "../middleware/validate";
import {
  dealerChangePasswordBodySchema,
  dealerCreateVehicleBodySchema,
  dealerLoginBodySchema,
  dealerOwnReviewsQuerySchema,
  dealerOwnVehiclesQuerySchema,
  dealerReviewReplyBodySchema,
  dealerSelfUpdateBodySchema,
  dealerUpdateBodySchema,
  dealerUpdateIdParamSchema,
  dealerUpdateVehicleBodySchema,
  dealerVehicleIdParamSchema,
  reviewIdParamSchemaForDealer,
} from "../validators/dealer-portal.validator";

const router = Router();

router.post(
  "/login",
  validate(dealerLoginBodySchema, "body"),
  dealerPortalController.login
);

router.use(requireDealer);

router.post("/logout", dealerPortalController.logout);

router.post(
  "/change-password",
  validate(dealerChangePasswordBodySchema, "body"),
  dealerPortalController.changePassword
);

router.get("/me", dealerPortalController.me);

router.put(
  "/profile",
  validate(dealerSelfUpdateBodySchema, "body"),
  dealerPortalController.updateProfile
);

router.get(
  "/reviews",
  validate(dealerOwnReviewsQuerySchema, "query"),
  dealerPortalController.reviews
);

router.put(
  "/reviews/:id/reply",
  validate(reviewIdParamSchemaForDealer, "params"),
  validate(dealerReviewReplyBodySchema, "body"),
  dealerPortalController.replyToReview
);

router.get("/updates", dealerPortalController.listUpdates);

router.post(
  "/updates",
  validate(dealerUpdateBodySchema, "body"),
  dealerPortalController.postUpdate
);

router.put(
  "/updates/:id",
  validate(dealerUpdateIdParamSchema, "params"),
  validate(dealerUpdateBodySchema, "body"),
  dealerPortalController.editUpdate
);

router.delete(
  "/updates/:id",
  validate(dealerUpdateIdParamSchema, "params"),
  dealerPortalController.deleteUpdate
);

router.post("/uploads/image", uploadImage, dealerPortalController.uploadImage);

router.get(
  "/vehicles",
  validate(dealerOwnVehiclesQuerySchema, "query"),
  dealerPortalController.vehicles
);

router.post(
  "/vehicles",
  validate(dealerCreateVehicleBodySchema, "body"),
  dealerPortalController.createVehicle
);

router.put(
  "/vehicles/:id",
  validate(dealerVehicleIdParamSchema, "params"),
  validate(dealerUpdateVehicleBodySchema, "body"),
  dealerPortalController.updateVehicle
);

router.delete(
  "/vehicles/:id",
  validate(dealerVehicleIdParamSchema, "params"),
  dealerPortalController.deleteVehicle
);

export default router;
