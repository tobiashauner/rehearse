import { z } from "zod";

export const authSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const signupSchema = authSchema.extend({
  name: z.string().min(1, "Name is required"),
});

export type AuthValues = z.infer<typeof authSchema>;
export type SignupValues = z.infer<typeof signupSchema>;
