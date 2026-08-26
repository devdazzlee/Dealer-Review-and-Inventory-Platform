import { Router } from "express";
import { visitController } from "../controllers/visit.controller";
import { validate } from "../middleware/validate";
import { trackVisitBodySchema } from "../validators/visit.validator";

const router = Router();

// Public, unauthenticated — fired once per visitor by frontend middleware
// right after it resolves their location via IP. Deliberately minimal:
// no admin token here since real visitors' browsers/edge requests can't
// carry one; strict body validation is the guard instead.
router.post(
  "/track",
  validate(trackVisitBodySchema, "body"),
  visitController.track
);

export default router;
