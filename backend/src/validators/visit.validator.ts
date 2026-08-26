import { z } from "zod";

export const trackVisitBodySchema = z.object({
  city: z.string().min(1, "city is required").max(120, "city is too long"),
  stateCode: z
    .string()
    .regex(/^[A-Z]{2}$/, "stateCode must be a 2-letter US state code"),
  path: z.string().max(300).optional(),
});

export type TrackVisitBody = z.infer<typeof trackVisitBodySchema>;
