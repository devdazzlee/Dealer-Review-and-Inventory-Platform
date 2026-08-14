import { Request, Response, NextFunction } from "express";
import { env } from "../config/env";
import { UnauthorizedError } from "../errors/AppError";

export function requireCron(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  const header = req.header("authorization") ?? "";
  const token = header.replace(/^Bearer\s+/i, "").trim();
  if (!env.cronSecret || token !== env.cronSecret) {
    next(new UnauthorizedError("Invalid cron credentials"));
    return;
  }
  next();
}
