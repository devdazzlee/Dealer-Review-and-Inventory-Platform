import { Router } from "express";
import { blogController } from "../controllers/blog.controller";
import { validate } from "../middleware/validate";
import {
  blogListQuerySchema,
  blogSlugParamSchema,
  newsletterBodySchema,
} from "../validators/blog.validator";

const router = Router();

router.get("/", validate(blogListQuerySchema, "query"), blogController.list);
router.get("/featured", blogController.featured);
router.get("/categories", blogController.categories);
router.get("/recent", blogController.recent);
router.get("/sitemap", blogController.sitemap);
router.post(
  "/newsletter",
  validate(newsletterBodySchema, "body"),
  blogController.subscribe
);
router.get(
  "/:slug",
  validate(blogSlugParamSchema, "params"),
  blogController.getBySlug
);

export default router;
