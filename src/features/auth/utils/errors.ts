import type { SignInErrors, SignUpErrors } from "../types/state";
import { SIGN_IN_ERROR_MAP, SIGN_UP_ERROR_MAP } from "../constants/errors";

/**
 * Maps Supabase auth error codes to user-friendly error messages for sign in
 */
export function mapSignInError(
  errorCode: string | undefined,
  fallbackMessage: string
): SignInErrors {
  if (errorCode && errorCode in SIGN_IN_ERROR_MAP) {
    return SIGN_IN_ERROR_MAP[errorCode as keyof typeof SIGN_IN_ERROR_MAP];
  }
  return { form: fallbackMessage || "Authentication failed" };
}

/**
 * Maps Supabase auth error codes to user-friendly error messages for sign up
 */
export function mapSignUpError(
  errorCode: string | undefined,
  fallbackMessage: string
): SignUpErrors {
  if (errorCode && errorCode in SIGN_UP_ERROR_MAP) {
    return SIGN_UP_ERROR_MAP[errorCode as keyof typeof SIGN_UP_ERROR_MAP];
  }
  return { form: fallbackMessage || "Sign up failed" };
}
