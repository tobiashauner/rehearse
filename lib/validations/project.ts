import { z } from "zod";

export const projectSchema = z.object({
  title: z.string().min(1, "Title is required"),
  company: z.string().optional(),
  role: z.string().optional(),
});

export type ProjectValues = z.infer<typeof projectSchema>;
