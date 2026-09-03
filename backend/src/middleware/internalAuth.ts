import { timingSafeEqual } from "node:crypto";
import { Request, Response, NextFunction } from "express";
import { env } from "../config/env";
import { UnauthorizedError } from "../errors/AppError";

export const INTERNAL_KEY_HEADER = "x-internal-key";

function secretsEqual(provided: string, expected: string): boolean {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) {
    timingSafeEqual(b, b);
    return false;
  }
  return timingSafeEqual(a, b);
}

/**
 * Shared-secret gate for machine-to-machine routes.
 * Caller must send header `x-internal-key` equal to INTERNAL_API_KEY.
 * Missing config, missing header, or a mismatch all return 401.
 */
export function requireInternalKey(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  const expected = env.internalApiKey;
  const provided = req.header(INTERNAL_KEY_HEADER)?.trim() ?? "";

  if (!expected || !provided || !secretsEqual(provided, expected)) {
    next(new UnauthorizedError("Invalid or missing internal API key"));
    return;
  }

  next();
}
