import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { MulterError } from "multer";
import { AppError } from "../errors/AppError";
import { env } from "../config/env";

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.message,
      code: err.code,
    });
    return;
  }

  if (err instanceof MulterError) {
    const message =
      err.code === "LIMIT_FILE_SIZE"
        ? "Image is too large (max 8MB)"
        : err.message;
    res.status(400).json({ error: message, code: "UPLOAD_ERROR" });
    return;
  }

  if (err instanceof ZodError) {
    res.status(400).json({
      error: err.errors.map((e) => e.message).join(", "),
      code: "VALIDATION_ERROR",
    });
    return;
  }

  console.error("Unhandled error:", err);

  res.status(500).json({
    error: env.isProduction ? "Internal server error" : err.message,
    code: "INTERNAL_ERROR",
  });
}
