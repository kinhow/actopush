import { z } from "zod";

export const signInSchema = z.object({
  email: z.email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

const passwordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .check(
    z.regex(/[A-Z]/, "Password must contain at least one uppercase letter"),
    z.regex(/[a-z]/, "Password must contain at least one lowercase letter"),
    z.regex(/[0-9]/, "Password must contain at least one number")
  );

// Server-side validation (no confirmPassword needed)
export const signUpServerSchema = z.object({
  email: z.email("Please enter a valid email address"),
  password: passwordSchema,
});

// Client-side validation (includes confirmPassword)
export const signUpSchema = signUpServerSchema.extend({
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

export type SignInFormValues = z.infer<typeof signInSchema>;
export type SignUpFormValues = z.infer<typeof signUpSchema>;
