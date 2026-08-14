import { Router } from "express";
import { vehicleController } from "../controllers/vehicle.controller";
import { validate } from "../middleware/validate";
import {
  dealerSlugParamSchema,
  vehicleFeaturedQuerySchema,
  vehicleIdParamSchema,
  vehicleListQuerySchema,
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
  "/dealer/:slug",
  validate(dealerSlugParamSchema, "params"),
  vehicleController.byDealer
);

router.get(
  "/:id",
  validate(vehicleIdParamSchema, "params"),
  vehicleController.getById
);

export default router;
