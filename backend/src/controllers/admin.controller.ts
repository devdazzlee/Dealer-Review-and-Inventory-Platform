import { Request, Response } from "express";
import { asyncHandler } from "../middleware/asyncHandler";
import { adminService } from "../services/admin.service";
import { dealerService } from "../services/dealer.service";
import {
  changeAdminPassword,
  verifyAdminPassword,
} from "../services/admin-auth.service";
import { UnauthorizedError } from "../errors/AppError";

export class AdminController {
  login = asyncHandler(async (req: Request, res: Response) => {
    const { password } = req.validatedBody!;
    if (!(await verifyAdminPassword(password))) {
      throw new UnauthorizedError("Incorrect password");
    }
    // Client stores this as X-Admin-Token (same shared-secret pattern as before).
    res.json({ success: true, token: password });
  });

  changePassword = asyncHandler(async (req: Request, res: Response) => {
    const { currentPassword, newPassword } = req.validatedBody!;
    await changeAdminPassword(currentPassword, newPassword);
    res.json({
      success: true,
      message: "Password updated. Use your new password for future logins.",
      token: newPassword,
    });
  });

  dashboard = asyncHandler(async (_req: Request, res: Response) => {
    const data = await adminService.dashboard();
    res.json(data);
  });

  listReviews = asyncHandler(async (req: Request, res: Response) => {
    const query = req.validatedQuery!;
    const data = await adminService.listReviews({
      status: query.status,
      search: query.search,
      dealerId: query.dealerId,
      rating: query.rating,
      page: query.page,
    });
    res.json(data);
  });

  reviewAction = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.validatedParams!;
    const { action } = req.validatedBody!;
    const result = await adminService.reviewAction(id, action);
    res.json(result);
  });

  bulkReviews = asyncHandler(async (req: Request, res: Response) => {
    const { ids, action } = req.validatedBody!;
    const result = await adminService.bulkReviewAction(ids, action);
    res.json(result);
  });

  listDealers = asyncHandler(async (req: Request, res: Response) => {
    const query = req.validatedQuery!;
    const data = await dealerService.adminList({
      search: query.search,
      featured: query.featured,
      hasBadge: query.hasBadge,
      page: query.page,
    });
    res.json(data);
  });

  updateDealer = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.validatedParams!;
    const body = req.validatedBody!;
    const dealer = await dealerService.adminUpdate(id, {
      ...body,
      email: body.email === "" ? null : body.email,
      website: body.website === "" ? null : body.website,
      logo: body.logo === "" ? null : body.logo,
      carfaxUrl: body.carfaxUrl === "" ? null : body.carfaxUrl,
    });
    res.json(dealer);
  });

  createDealer = asyncHandler(async (req: Request, res: Response) => {
    const body = req.validatedBody!;
    const dealer = await dealerService.createDealer({
      ...body,
      email: body.email === "" ? null : body.email,
      website: body.website === "" ? null : body.website,
      logo: body.logo === "" ? null : body.logo,
      carfaxUrl: body.carfaxUrl === "" ? null : body.carfaxUrl,
      badgeYear: body.hasBadge ? body.badgeYear ?? null : null,
    });
    res.status(201).json(dealer);
  });

  deleteDealer = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.validatedParams!;
    const result = await dealerService.adminDelete(id);
    res.json(result);
  });

  ratingPreview = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.validatedParams!;
    const preview = await dealerService.ratingPreview(id);
    res.json(preview);
  });

  getRatingSettings = asyncHandler(async (_req: Request, res: Response) => {
    const settings = await adminService.getRatingSettings();
    res.json(settings);
  });

  updateRatingSettings = asyncHandler(async (req: Request, res: Response) => {
    const settings = await adminService.updateRatingSettings(req.validatedBody!);
    const impact = await adminService.ratingSettingsImpactPreview();
    res.json({ settings, impact });
  });

  listBadgedDealers = asyncHandler(async (_req: Request, res: Response) => {
    const dealers = await dealerService.listBadged();
    res.json(dealers);
  });

  dealersForSelect = asyncHandler(async (_req: Request, res: Response) => {
    const dealers = await dealerService.listForSelect();
    res.json(dealers);
  });

  assignBadge = asyncHandler(async (req: Request, res: Response) => {
    const { dealerId, badgeYear } = req.validatedBody!;
    const dealer = await adminService.assignBadge(dealerId, badgeYear);
    res.json(dealer);
  });

  revokeBadge = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.validatedParams!;
    const dealer = await adminService.revokeBadge(id);
    res.json(dealer);
  });

  listReports = asyncHandler(async (req: Request, res: Response) => {
    const query = req.validatedQuery!;
    const data = await adminService.listReports({
      status: query.status,
      search: query.search,
      page: query.page,
    });
    res.json(data);
  });

  resolveReport = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.validatedParams!;
    const report = await adminService.resolveReport(id);
    res.json(report);
  });
}

export const adminController = new AdminController();
