import { Router } from "express";
import { badgeController } from "../controllers/badge.controller";
import { validate } from "../middleware/validate";
import { badgeSlugParamSchema } from "../validators/admin.validator";

const router = Router();

router.get(
  "/:slug/widget.js",
  validate(badgeSlugParamSchema, "params"),
  badgeController.widgetJs
);

router.get(
  "/:slug",
  validate(badgeSlugParamSchema, "params"),
  badgeController.getData
);

export default router;
