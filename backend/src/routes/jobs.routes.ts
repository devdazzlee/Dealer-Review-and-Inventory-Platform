import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler";
import { requireCron } from "../middleware/cronAuth";
import { runInventoryJob, runRatingsJob } from "../services/jobs.service";

const router = Router();

router.use(requireCron);

router.post(
  "/inventory-sync",
  asyncHandler(async (_req, res) => {
    const result = await runInventoryJob();
    res.json(result);
  })
);

router.post(
  "/ratings-sync",
  asyncHandler(async (_req, res) => {
    const result = await runRatingsJob();
    res.json(result);
  })
);

export default router;
