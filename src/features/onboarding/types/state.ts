export type OnboardingErrors = {
  fullName?: string;
  orgName?: string;
  form?: string;
};

export type OnboardingState = {
  success: boolean;
  errors?: OnboardingErrors;
} | null;
