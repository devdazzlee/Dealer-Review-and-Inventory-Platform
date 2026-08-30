import { Request, Response } from "express";
import { asyncHandler } from "../middleware/asyncHandler";
import { dealerAuthService } from "../services/dealer-auth.service";
import { dealerPortalService } from "../services/dealer-portal.service";
import { DEALER_TOKEN_HEADER } from "../middleware/dealerAuth";
import { uploadAdminImage } from "../services/image-upload.service";
import { ValidationError } from "../errors/AppError";

/** Only these Cloudinary sub-folders are reachable from the dealer portal —
 * a dealer picks one via ?type=, never an arbitrary folder string. */
const UPLOAD_FOLDERS = { vehicle: "vehicles", logo: "dealers" } as const;

export class DealerPortalController {
  login = asyncHandler(async (req: Request, res: Response) => {
    const { loginEmail, password } = req.validatedBody!;
    const result = await dealerAuthService.login(loginEmail, password);
    res.json(result);
  });

  logout = asyncHandler(async (req: Request, res: Response) => {
    const token = req.header(DEALER_TOKEN_HEADER)?.trim();
    if (token) await dealerAuthService.logout(token);
    res.json({ success: true });
  });

  changePassword = asyncHandler(async (req: Request, res: Response) => {
    const { currentPassword, newPassword } = req.validatedBody!;
    const result = await dealerAuthService.changeOwnPassword(
      req.dealerId!,
      currentPassword,
      newPassword
    );
    res.json(result);
  });

  me = asyncHandler(async (req: Request, res: Response) => {
    const profile = await dealerPortalService.getProfile(req.dealerId!);
    res.json(profile);
  });

  updateProfile = asyncHandler(async (req: Request, res: Response) => {
    const profile = await dealerPortalService.updateProfile(
      req.dealerId!,
      req.validatedBody!
    );
    res.json(profile);
  });

  reviews = asyncHandler(async (req: Request, res: Response) => {
    const query = req.validatedQuery!;
    const data = await dealerPortalService.listOwnReviews(req.dealerId!, {
      status: query.status,
      page: query.page,
    });
    res.json(data);
  });

  replyToReview = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.validatedParams!;
    const { reply } = req.validatedBody!;
    const result = await dealerPortalService.replyToOwnReview(
      req.dealerId!,
      id,
      reply
    );
    res.json(result);
  });

  listUpdates = asyncHandler(async (req: Request, res: Response) => {
    const updates = await dealerPortalService.listOwnUpdates(req.dealerId!);
    res.json(updates);
  });

  postUpdate = asyncHandler(async (req: Request, res: Response) => {
    const { title, body } = req.validatedBody!;
    const update = await dealerPortalService.postUpdate(req.dealerId!, title, body);
    res.status(201).json(update);
  });

  editUpdate = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.validatedParams!;
    const { title, body } = req.validatedBody!;
    const update = await dealerPortalService.updateOwnUpdate(req.dealerId!, id, title, body);
    res.json(update);
  });

  deleteUpdate = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.validatedParams!;
    const result = await dealerPortalService.deleteOwnUpdate(req.dealerId!, id);
    res.json(result);
  });

  vehicles = asyncHandler(async (req: Request, res: Response) => {
    const { page } = req.validatedQuery!;
    const result = await dealerPortalService.listOwnVehicles(req.dealerId!, { page });
    res.json(result);
  });

  createVehicle = asyncHandler(async (req: Request, res: Response) => {
    const vehicle = await dealerPortalService.createVehicle(
      req.dealerId!,
      req.validatedBody!
    );
    res.status(201).json(vehicle);
  });

  updateVehicle = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.validatedParams!;
    const vehicle = await dealerPortalService.updateVehicle(
      req.dealerId!,
      id,
      req.validatedBody!
    );
    res.json(vehicle);
  });

  deleteVehicle = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.validatedParams!;
    const result = await dealerPortalService.deleteVehicle(req.dealerId!, id);
    res.json(result);
  });

  uploadImage = asyncHandler(async (req: Request, res: Response) => {
    if (!req.file) {
      throw new ValidationError("No image file uploaded");
    }
    const type = req.query.type === "logo" ? "logo" : "vehicle";
    const url = await uploadAdminImage(
      { buffer: req.file.buffer, mimetype: req.file.mimetype },
      UPLOAD_FOLDERS[type]
    );
    res.status(201).json({ url });
  });
}

export const dealerPortalController = new DealerPortalController();
