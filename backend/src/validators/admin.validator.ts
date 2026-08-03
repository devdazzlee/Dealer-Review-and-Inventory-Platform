import { z } from "zod";
import { VALID_STATES } from "../config/constants";
import { REVIEW_STATUS } from "../config/constants";

const stateCodeSchema = z.enum(VALID_STATES);

const optionalRating = z
  .number()
  .min(0)
  .max(5)
  .nullable()
  .optional();

const optionalCount = z.number().int().min(0).nullable().optional();

export const adminLoginBodySchema = z.object({
  password: z.string().min(1, "Password is required"),
});

export const adminChangePasswordBodySchema = z
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

export const adminReviewsQuerySchema = z.object({
  status: z
    .enum(["all", REVIEW_STATUS.pending, REVIEW_STATUS.approved, REVIEW_STATUS.rejected])
    .optional()
    .default("all"),
  search: z.string().trim().optional(),
  dealerId: z.string().trim().min(1).optional(),
  rating: z.preprocess(
    (v) => (v === undefined || v === "" ? undefined : Number(v)),
    z.number().int().min(1).max(5).optional()
  ),
  page: z.preprocess(
    (v) => (v === undefined || v === "" ? 1 : Number(v)),
    z.number().int().min(1).default(1)
  ),
});

export const adminReviewActionBodySchema = z.object({
  action: z.enum(["approve", "reject", "delete"]),
});

export const adminBulkReviewsBodySchema = z.object({
  ids: z.array(z.string().min(1)).min(1, "Select at least one review"),
  action: z.enum(["approve", "reject", "delete"]),
});

const optionalBooleanParam = z.preprocess((v) => {
  if (v === undefined || v === "") return undefined;
  if (v === "true") return true;
  if (v === "false") return false;
  return v;
}, z.boolean().optional());

export const adminDealersQuerySchema = z.object({
  search: z.string().trim().optional(),
  featured: optionalBooleanParam,
  hasBadge: optionalBooleanParam,
  page: z.preprocess(
    (v) => (v === undefined || v === "" ? 1 : Number(v)),
    z.number().int().min(1).default(1)
  ),
});

export const adminDealerIdParamSchema = z.object({
  id: z.string().min(1),
});

export const adminUpdateDealerBodySchema = z.object({
  name: z.string().trim().min(1).optional(),
  address: z.string().trim().min(1).optional(),
  city: z.string().trim().min(1).optional(),
  state: z
    .string()
    .trim()
    .toUpperCase()
    .pipe(stateCodeSchema)
    .optional(),
  zip: z.string().trim().min(1).optional(),
  phone: z.string().trim().nullable().optional(),
  email: z
    .string()
    .email()
    .nullable()
    .optional()
    .or(z.literal("")),
  website: z
    .string()
    .url()
    .nullable()
    .optional()
    .or(z.literal("")),
  description: z.string().trim().nullable().optional(),
  logo: z.string().url().nullable().optional().or(z.literal("")),
  featured: z.boolean().optional(),
  googleRating: optionalRating,
  googleReviewCount: optionalCount,
  yelpRating: optionalRating,
  yelpReviewCount: optionalCount,
  carfaxRating: optionalRating,
  carfaxUrl: z.string().url().nullable().optional().or(z.literal("")),
  autoSalesReviewsRating: optionalRating,
  manualRatingOverride: optionalRating,
  useManualRating: z.boolean().optional(),
  hasBadge: z.boolean().optional(),
  badgeYear: z.number().int().min(2000).max(2100).nullable().optional(),
});

export const adminCreateDealerBodySchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  address: z.string().trim().min(1, "Address is required"),
  city: z.string().trim().min(1, "City is required"),
  state: z.string().trim().toUpperCase().pipe(stateCodeSchema),
  zip: z.string().trim().min(1, "ZIP is required"),
  phone: z.string().trim().nullable().optional(),
  email: z
    .string()
    .email()
    .nullable()
    .optional()
    .or(z.literal("")),
  website: z
    .string()
    .url()
    .nullable()
    .optional()
    .or(z.literal("")),
  description: z.string().trim().nullable().optional(),
  logo: z.string().url().nullable().optional().or(z.literal("")),
  featured: z.boolean().optional().default(false),
  googleRating: optionalRating,
  googleReviewCount: optionalCount,
  yelpRating: optionalRating,
  yelpReviewCount: optionalCount,
  carfaxRating: optionalRating,
  carfaxUrl: z.string().url().nullable().optional().or(z.literal("")),
  autoSalesReviewsRating: optionalRating,
  manualRatingOverride: optionalRating,
  useManualRating: z.boolean().optional().default(false),
  hasBadge: z.boolean().optional().default(false),
  badgeYear: z.number().int().min(2000).max(2100).nullable().optional(),
});

export const ratingSettingsBodySchema = z.object({
  googleEnabled: z.boolean().optional(),
  yelpEnabled: z.boolean().optional(),
  carfaxEnabled: z.boolean().optional(),
  autoSalesReviewsEnabled: z.boolean().optional(),
  platformEnabled: z.boolean().optional(),
});

export const assignBadgeBodySchema = z.object({
  dealerId: z.string().min(1),
  badgeYear: z.number().int().min(2000).max(2100),
});

export const badgeSlugParamSchema = z.object({
  slug: z.string().min(1),
});

export const adminReportsQuerySchema = z.object({
  status: z.enum(["open", "resolved", "all"]).optional().default("open"),
  search: z.string().trim().optional(),
  page: z.preprocess(
    (v) => (v === undefined || v === "" ? 1 : Number(v)),
    z.number().int().min(1).default(1)
  ),
});

export const adminReportIdParamSchema = z.object({
  id: z.string().min(1),
});
