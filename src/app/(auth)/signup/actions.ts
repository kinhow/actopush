"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { signUpSchema } from "@/lib/zod/validate";
import { createClient } from "@/lib/supabase/server";

export type SignUpState = {
  success: boolean;
  errors?: {
    email?: string;
    password?: string;
    confirmPassword?: string;
    form?: string;
  };
} | null;

export async function signUp(
  _prevState: SignUpState,
  formData: FormData
): Promise<SignUpState> {
  const supabase = await createClient();

  const rawData = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    confirmPassword: formData.get("confirmPassword") as string,
  };

  const result = signUpSchema.safeParse(rawData);
  if (!result.success) {
    // Use z.flattenError instead of deprecated .flatten() method
    const { fieldErrors, formErrors } = z.flattenError(result.error);
    return {
      success: false,
      errors: {
        email: fieldErrors.email?.[0],
        password: fieldErrors.password?.[0],
        confirmPassword: fieldErrors.confirmPassword?.[0] || formErrors[0],
      },
    };
  }

  const { data, error } = await supabase.auth.signUp({
    email: result.data.email,
    password: result.data.password,
  });

  if (error) {
    // Map Supabase auth error codes for precise error handling
    // Note: Use generic messages for security-sensitive errors to prevent email enumeration
    switch (error.code) {
      case "user_already_exists":
        // Generic message to prevent email enumeration attacks
        return {
          success: false,
          errors: { form: "Unable to create account. Please try again or sign in." },
        };
      case "weak_password":
        return {
          success: false,
          errors: { password: "Password is too weak" },
        };
      case "over_request_rate_limit":
        return {
          success: false,
          errors: { form: "Too many attempts. Please try again later." },
        };
      default:
        return {
          success: false,
          errors: { form: error.message || "Sign up failed" },
        };
    }
  }

  // If session is null but user exists, email confirmation is required
  if (data.user && !data.session) {
    redirect(`/signup/confirm?email=${encodeURIComponent(result.data.email)}`);
  }

  // If session exists, user is logged in (email confirmation disabled)
  revalidatePath("/", "layout");
  redirect("/");
}

export async function signUpWithGoogle() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  });

  if (error) {
    redirect("/auth/error?message=Could not authenticate with Google");
  }

  if (data.url) {
    redirect(data.url);
  }
}
