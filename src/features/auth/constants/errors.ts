import type { SignInErrors, SignUpErrors } from "../types/state";

/**
 * Supabase Auth error code mappings for sign in
 * @see https://supabase.com/docs/guides/auth/debugging/error-codes
 */
export const SIGN_IN_ERROR_MAP = {
  invalid_credentials: { form: "Invalid email or password" },
  email_not_confirmed: { email: "Please verify your email address" },
  user_not_found: { email: "No account found with this email" },
  over_request_rate_limit: { form: "Too many attempts. Please try again later." },
} as const satisfies Record<string, SignInErrors>;

/**
 * Supabase Auth error code mappings for sign up
 * Note: user_already_exists uses generic message to prevent email enumeration
 * @see https://supabase.com/docs/guides/auth/debugging/error-codes
 */
export const SIGN_UP_ERROR_MAP = {
  user_already_exists: { form: "Unable to create account. Please try again or sign in." },
  weak_password: { password: "Password is too weak" },
  over_request_rate_limit: { form: "Too many attempts. Please try again later." },
} as const satisfies Record<string, SignUpErrors>;
