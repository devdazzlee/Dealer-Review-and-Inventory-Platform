import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler";
import { requireCron } from "../middleware/cronAuth";
import {
  runDealerDiscoveryJob,
  runGooglePlaceLookupJob,
  runInventoryJob,
  runPhotoCatchupJob,
  runRatingsJob,
  runYelpLookupJob,
} from "../services/jobs.service";

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

router.post(
  "/dealer-discovery",
  asyncHandler(async (_req, res) => {
    const result = await runDealerDiscoveryJob();
    res.json(result);
  })
);

router.post(
  "/google-place-lookup",
  asyncHandler(async (_req, res) => {
    const result = await runGooglePlaceLookupJob();
    res.json(result);
  })
);

router.post(
  "/yelp-lookup",
  asyncHandler(async (_req, res) => {
    const result = await runYelpLookupJob();
    res.json(result);
  })
);

router.post(
  "/photo-catchup",
  asyncHandler(async (_req, res) => {
    const result = await runPhotoCatchupJob();
    res.json(result);
  })
);

export default router;
