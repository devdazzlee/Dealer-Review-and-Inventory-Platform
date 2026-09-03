import { Router } from "express";
import { vehicleController } from "../controllers/vehicle.controller";
import { requireInternalKey } from "../middleware/internalAuth";
import { validate } from "../middleware/validate";
import {
  dealerSlugParamSchema,
  vehicleFeaturedQuerySchema,
  vehicleIdParamSchema,
  vehicleListQuerySchema,
  vehicleSlugParamSchema,
  vehicleTopCitiesQuerySchema,
} from "../validators/vehicle.validator";

const router = Router();

router.get(
  "/",
  validate(vehicleListQuerySchema, "query"),
  vehicleController.list
);

router.get(
  "/featured",
  validate(vehicleFeaturedQuerySchema, "query"),
  vehicleController.featured
);

router.get("/sitemap", vehicleController.sitemap);

router.get(
  "/top-cities",
  validate(vehicleTopCitiesQuerySchema, "query"),
  vehicleController.topCities
);

// Must stay ahead of "/dealer/:slug" only in the sense that both are
// registered before the "/:id" catch-all below — Express disambiguates
// these two from each other by segment count, so their relative order
// doesn't matter.
router.get(
  "/dealer/:slug/:vehicleSlug",
  validate(vehicleSlugParamSchema, "params"),
  vehicleController.bySlug
);

router.get(
  "/dealer/:slug",
  requireInternalKey,
  validate(dealerSlugParamSchema, "params"),
  vehicleController.byDealer
);

router.get(
  "/:id",
  validate(vehicleIdParamSchema, "params"),
  vehicleController.getById
);

export default router;
