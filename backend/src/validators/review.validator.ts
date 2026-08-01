import { z } from "zod";
import { REVIEW_SORT, VISIT_TYPES } from "../config/constants";

const starRating = z
  .number({ invalid_type_error: "Rating must be a number" })
  .int("Rating must be a whole number")
  .min(1, "Rating must be at least 1")
  .max(5, "Rating must be at most 5");

const optionalStar = starRating.optional().nullable();

export const submitReviewBodySchema = z.object({
  dealerSlug: z.string().min(1, "Dealer is required"),
  authorName: z
    .string()
    .trim()
    .min(2, "Full name is required")
    .max(100, "Name is too long"),
  email: z.string().trim().email("A valid email is required"),
  overallRating: starRating,
  customerServiceRating: optionalStar,
  qualityRating: optionalStar,
  friendlinessRating: optionalStar,
  pricingRating: optionalStar,
  recommend: z.boolean().optional().nullable(),
  title: z
    .string()
    .trim()
    .min(1, "Review title is required")
    .max(100, "Title must be 100 characters or fewer"),
  comment: z
    .string()
    .trim()
    .min(25, "Review comment must be at least 25 characters")
    .max(2000, "Review comment must be 2000 characters or fewer"),
  visitDate: z
    .string()
    .optional()
    .nullable()
    .or(z.literal(""))
    .refine(
      (v) => !v || !Number.isNaN(Date.parse(v)),
      "Visit date must be a valid date"
    ),
  visitType: z
    .union([z.enum(VISIT_TYPES), z.literal(""), z.null()])
    .optional(),
  /** Honeypot — must be empty */
  website: z.string().optional().nullable(),
  /** Milliseconds the form has been open */
  formOpenMs: z.number().min(0),
});

export const dealerReviewsQuerySchema = z.object({
  page: z.preprocess(
    (v) => (v === undefined || v === "" ? 1 : Number(v)),
    z.number().int().min(1).default(1)
  ),
  sort: z
    .enum([REVIEW_SORT.recent, REVIEW_SORT.highest, REVIEW_SORT.lowest])
    .optional()
    .default(REVIEW_SORT.recent),
});

export const reviewIdParamSchema = z.object({
  id: z.string().min(1, "Review id is required"),
});

export const helpfulBodySchema = z.object({
  helpful: z.boolean(),
});

export const reportReviewBodySchema = z.object({
  reason: z
    .string()
    .trim()
    .min(3, "Please provide a short reason")
    .max(500, "Reason must be 500 characters or fewer"),
});

export type SubmitReviewInput = z.infer<typeof submitReviewBodySchema>;
export type ReportReviewInput = z.infer<typeof reportReviewBodySchema>;