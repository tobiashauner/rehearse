import { z } from "zod";

/** In-app CSAT: a 1–5 satisfaction rating plus an optional comment. */
export const feedbackSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().trim().max(2000).optional(),
  pagePath: z.string().max(512).optional(),
});

export type FeedbackValues = z.infer<typeof feedbackSchema>;

/** The five CSAT levels, low → high, with a short accessible label. */
export const CSAT_LEVELS = [
  { value: 1, label: "Very dissatisfied" },
  { value: 2, label: "Dissatisfied" },
  { value: 3, label: "Neutral" },
  { value: 4, label: "Satisfied" },
  { value: 5, label: "Very satisfied" },
] as const;
