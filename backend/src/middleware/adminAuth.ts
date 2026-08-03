import { Request, Response, NextFunction } from "express";
import { UnauthorizedError } from "../errors/AppError";
import { verifyAdminPassword } from "../services/admin-auth.service";

export const ADMIN_TOKEN_HEADER = "x-admin-token";

/**
 * Shared-secret admin auth.
 * Client sends the admin password as X-Admin-Token after login.
 * Password is verified against AdminAccount.passwordHash in the database only.
 */
export async function requireAdmin(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  try {
    const token = req.header(ADMIN_TOKEN_HEADER)?.trim();
    if (!token || !(await verifyAdminPassword(token))) {
      next(new UnauthorizedError("Invalid or missing admin credentials"));
      return;
    }
    next();
  } catch (error) {
    next(error);
  }
}
