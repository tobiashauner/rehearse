import { z } from "zod";

export const authSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const signupSchema = authSchema.extend({
  name: z.string().min(1, "Name is required"),
  acceptTerms: z.boolean().refine((v) => v === true, {
    message: "Please accept the Terms and Privacy Policy",
  }),
});

export type AuthValues = z.infer<typeof authSchema>;
export type SignupValues = z.infer<typeof signupSchema>;

export const resetRequestSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, {
    message: "Passwords don't match",
    path: ["confirm"],
  });

export type ResetRequestValues = z.infer<typeof resetRequestSchema>;
export type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;
