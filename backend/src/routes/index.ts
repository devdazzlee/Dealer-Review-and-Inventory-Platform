import { Router } from "express";
import dealerRoutes from "./dealer.routes";
import savedRoutes from "./saved.routes";
import reviewRoutes from "./review.routes";
import adminRoutes from "./admin.routes";
import badgeRoutes from "./badge.routes";

const router = Router();

router.use("/dealers", dealerRoutes);
router.use("/saved", savedRoutes);
router.use("/reviews", reviewRoutes);
router.use("/admin", adminRoutes);
router.use("/badge", badgeRoutes);

export default router;
