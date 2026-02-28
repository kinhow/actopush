import { z } from "zod";

export const onboardingSchema = z.object({
  fullName: z.string().min(1, "Full name is required"),
  orgName: z
    .string()
    .min(2, "Organization name must be at least 2 characters")
    .max(100, "Organization name must be at most 100 characters"),
});

export type OnboardingFormValues = z.infer<typeof onboardingSchema>;
