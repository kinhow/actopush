/**
 * Base error fields shared across all auth forms
 */
export type BaseAuthErrors = {
  email?: string;
  password?: string;
  form?: string;
};

/**
 * Sign in specific error fields
 */
export type SignInErrors = BaseAuthErrors;

/**
 * Sign up specific error fields (includes confirmPassword)
 */
export type SignUpErrors = BaseAuthErrors & {
  confirmPassword?: string;
};

/**
 * Generic auth state for server actions
 * Uses discriminated union pattern for type-safe error handling
 */
export type AuthState<TErrors extends BaseAuthErrors = BaseAuthErrors> = {
  success: boolean;
  message?: string;
  errors?: TErrors;
} | null;

/**
 * Specific state types for each auth flow
 */
export type SignInState = AuthState<SignInErrors>;
export type SignUpState = AuthState<SignUpErrors>;
