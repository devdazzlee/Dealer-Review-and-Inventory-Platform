import { z, type ZodTypeAny } from "zod";

/**
 * Client-side mirrors of backend/src/validators/dealer-portal.validator.ts.
 * These run before a request ever leaves the browser so a dealer sees
 * exactly what's wrong with a field instead of a generic error banner —
 * the backend schemas remain the source of truth and re-validate on save.
 */

export const loginSchema = z.object({
  loginEmail: z.string().trim().min(1, "Email is required").email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export const changePasswordSchema = z
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

const optionalUrl = z
  .string()
  .trim()
  .refine((v) => v === "" || /^https?:\/\/.+/i.test(v), "Enter a valid URL starting with http:// or https://");

const optionalEmail = z
  .string()
  .trim()
  .refine((v) => v === "" || z.string().email().safeParse(v).success, "Enter a valid email address");

export const profileSchema = z.object({
  name: z.string().trim().min(1, "Business name is required").max(200, "Name is too long"),
  phone: z.string().trim().max(30, "Phone number looks too long"),
  email: optionalEmail,
  website: optionalUrl,
  description: z.string().trim().max(2000, "Description is too long (max 2000 characters)"),
  logo: optionalUrl,
});

const numericField = (label: string) =>
  z
    .string()
    .trim()
    .refine((v) => v === "" || !Number.isNaN(Number(v)), `${label} must be a number`)
    .refine((v) => v === "" || Number(v) >= 0, `${label} can't be negative`);

const photosField = z.string().refine((v) => {
  const urls = v
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean);
  return urls.every((u) => /^https?:\/\/.+/i.test(u));
}, "Each photo must be a valid URL, one per line (starting with http:// or https://)");

export const dealerUpdateFormSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200, "Title is too long (max 200 characters)"),
  body: z.string().trim().min(1, "Update text is required").max(5000, "Update text is too long (max 5000 characters)"),
});

export const vehicleFormSchema = z.object({
  vin: z.string().trim().min(5, "VIN looks too short (min 5 characters)").max(20, "VIN looks too long (max 20 characters)"),
  year: z
    .string()
    .trim()
    .min(1, "Year is required")
    .refine((v) => !Number.isNaN(Number(v)), "Year must be a number")
    .refine((v) => Number(v) >= 1900 && Number(v) <= 2100, "Enter a year between 1900 and 2100"),
  make: z.string().trim().min(1, "Make is required"),
  model: z.string().trim().min(1, "Model is required"),
  mileage: numericField("Mileage"),
  price: numericField("Price"),
  description: z.string().trim().max(5000, "Description is too long (max 5000 characters)"),
  photos: photosField,
});

/** Runs a zod schema and flattens the result into one message per field,
 * ready to hand straight to a field's `error` prop. Returns `null` when
 * everything is valid. */
export function getFieldErrors(
  schema: ZodTypeAny,
  values: Record<string, unknown>
): Record<string, string> | null {
  const result = schema.safeParse(values);
  if (result.success) return null;
  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = String(issue.path[0] ?? "_form");
    if (!errors[key]) errors[key] = issue.message;
  }
  return errors;
}
