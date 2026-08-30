import { Request, Response, NextFunction } from "express";
import { UnauthorizedError } from "../errors/AppError";
import { dealerAuthService } from "../services/dealer-auth.service";

export const DEALER_TOKEN_HEADER = "x-dealer-token";

/**
 * Dealer portal auth. Client sends the opaque session token issued at login
 * as X-Dealer-Token. Verified against DealerSession in the database (not a
 * shared secret like admin auth — there are many dealer accounts, so
 * sessions need to be individually revocable and expiring).
 */
export async function requireDealer(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  try {
    const token = req.header(DEALER_TOKEN_HEADER)?.trim();
    const dealerId = token ? await dealerAuthService.verifySession(token) : null;
    if (!dealerId) {
      next(new UnauthorizedError("Invalid or expired dealer session"));
      return;
    }
    req.dealerId = dealerId;
    next();
  } catch (error) {
    next(error);
  }
}
