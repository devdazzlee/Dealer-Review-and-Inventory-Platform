import { Request, Response, NextFunction } from "express";
import { env } from "../config/env";
import { UnauthorizedError } from "../errors/AppError";

export const ADMIN_TOKEN_HEADER = "x-admin-token";

/**
 * Simple shared-secret admin auth.
 * Client sends ADMIN_PASSWORD as X-Admin-Token after login.
 */
export function requireAdmin(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  const token = req.header(ADMIN_TOKEN_HEADER)?.trim();
  if (!token || token !== env.adminPassword) {
    next(new UnauthorizedError("Invalid or missing admin credentials"));
    return;
  }
  next();
}

export function verifyAdminPassword(password: string): boolean {
  return password === env.adminPassword;
}
