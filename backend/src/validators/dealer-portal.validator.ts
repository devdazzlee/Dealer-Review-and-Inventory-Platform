import { z } from "zod";
import { REVIEW_STATUS } from "../config/constants";

export const dealerLoginBodySchema = z.object({
  loginEmail: z.string().trim().email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const dealerChangePasswordBodySchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z
      .string()
      .min(8, "New password must be at least 8 characters")
      .max(128, "New password is too long"),
    confirmPassword: z.string().min(1, "Please confirm the new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "New password and confirmation do not match",
    path: ["confirmPassword"],
  });

/**
 * Deliberately narrow — dealers can update their own name and public contact
 * info, nothing that touches trust or rating math (no featured/badge/rating
 * fields, no source, no sync IDs). Those stay admin-only. Renaming is safe:
 * the public profile URL is generated once at creation and never re-derived
 * from name on update, so this can't break a dealer's own link.
 */
export const dealerSelfUpdateBodySchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200).optional(),
  phone: z.string().trim().nullable().optional(),
  email: z.string().email().nullable().optional().or(z.literal("")),
  website: z.string().url().nullable().optional().or(z.literal("")),
  description: z.string().trim().max(2000).nullable().optional(),
  logo: z.string().url().nullable().optional().or(z.literal("")),
});

export const dealerOwnReviewsQuerySchema = z.object({
  status: z
    .enum(["all", REVIEW_STATUS.pending, REVIEW_STATUS.approved, REVIEW_STATUS.rejected])
    .optional()
    .default("all"),
  page: z.preprocess(
    (v) => (v === undefined || v === "" ? 1 : Number(v)),
    z.number().int().min(1).default(1)
  ),
});

export const dealerOwnVehiclesQuerySchema = z.object({
  page: z.preprocess(
    (v) => (v === undefined || v === "" ? 1 : Number(v)),
    z.number().int().min(1).default(1)
  ),
});

export const dealerReviewReplyBodySchema = z.object({
  reply: z.string().trim().max(2000).nullable(),
});

export const dealerUpdateBodySchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
  body: z.string().trim().min(1, "Update text is required").max(5000),
});

export const dealerUpdateIdParamSchema = z.object({
  id: z.string().min(1),
});

export const reviewIdParamSchemaForDealer = z.object({
  id: z.string().min(1),
});

/** Splits on newlines or commas and drops blanks — used for the photo URL
 * textarea and the comma-separated features field. */
function splitLines(value: unknown): string[] {
  if (typeof value !== "string") return [];
  return value
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

const vehicleFieldsSchema = {
  vin: z
    .string()
    .trim()
    .min(5, "VIN looks too short")
    .max(20, "VIN looks too long"),
  year: z.number().int().min(1900).max(2100),
  make: z.string().trim().min(1, "Make is required"),
  model: z.string().trim().min(1, "Model is required"),
  trim: z.string().trim().nullable().optional(),
  mileage: z.number().int().min(0).nullable().optional(),
  bodyStyle: z.string().trim().nullable().optional(),
  fuelType: z.string().trim().nullable().optional(),
  transmission: z.string().trim().nullable().optional(),
  exteriorColor: z.string().trim().nullable().optional(),
  interiorColor: z.string().trim().nullable().optional(),
  condition: z.string().trim().nullable().optional(),
  price: z.number().min(0).nullable().optional(),
  description: z.string().trim().max(5000).nullable().optional(),
  features: z.preprocess(splitLines, z.array(z.string())).optional(),
  photos: z.preprocess(splitLines, z.array(z.string().url())).optional(),
};

export const dealerCreateVehicleBodySchema = z.object(vehicleFieldsSchema);

export const dealerUpdateVehicleBodySchema = z.object({
  ...vehicleFieldsSchema,
  vin: vehicleFieldsSchema.vin.optional(),
  year: vehicleFieldsSchema.year.optional(),
  make: vehicleFieldsSchema.make.optional(),
  model: vehicleFieldsSchema.model.optional(),
});

export const dealerVehicleIdParamSchema = z.object({
  id: z.string().min(1),
});
