"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { signInSchema } from "@/lib/zod/validate";
import { createClient } from "@/lib/supabase/server";

export type SignInState = {
  success: boolean;
  errors?: {
    email?: string;
    password?: string;
    form?: string;
  };
} | null;

export async function signIn(
  _prevState: SignInState,
  formData: FormData
): Promise<SignInState> {
  const supabase = await createClient();

  const rawData = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const result = signInSchema.safeParse(rawData);
  if (!result.success) {
    // Use z.flattenError instead of deprecated .flatten() method
    const { fieldErrors } = z.flattenError(result.error);
    return {
      success: false,
      errors: {
        email: fieldErrors.email?.[0],
        password: fieldErrors.password?.[0],
      },
    };
  }

  const { error } = await supabase.auth.signInWithPassword(result.data);

  if (error) {
    // Map Supabase auth error codes for precise error handling
    // See: https://supabase.com/docs/guides/auth/debugging/error-codes
    switch (error.code) {
      case "invalid_credentials":
        return {
          success: false,
          errors: { form: "Invalid email or password" },
        };
      case "email_not_confirmed":
        return {
          success: false,
          errors: { email: "Please verify your email address" },
        };
      case "user_not_found":
        return {
          success: false,
          errors: { email: "No account found with this email" },
        };
      case "over_request_rate_limit":
        return {
          success: false,
          errors: { form: "Too many attempts. Please try again later." },
        };
      default:
        return {
          success: false,
          errors: { form: error.message || "Authentication failed" },
        };
    }
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function signInWithGoogle() {
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
