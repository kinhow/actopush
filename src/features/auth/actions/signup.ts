"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { signUpSchema } from "../schemas/validation";
import { createClient } from "@/lib/supabase/server";
import type { SignUpState } from "../types/state";
import { mapSignUpError } from "../utils/errors";

export async function signUp(
  _prevState: SignUpState,
  formData: FormData
): Promise<SignUpState> {
  const rawData = {
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  };

  const result = signUpSchema.safeParse(rawData);
  if (!result.success) {
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

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: result.data.email,
    password: result.data.password,
  });

  if (error) {
    return {
      success: false,
      errors: mapSignUpError(error.code, error.message),
    };
  }

  // If session is null but user exists, email confirmation is required
  if (data.user && !data.session) {
    return {
      success: true,
      message: `We've sent a confirmation link to ${result.data.email}. Please check your inbox to verify your account.`,
    };
  }

  // If session exists, user is logged in (email confirmation disabled)
  revalidatePath("/", "layout");
  redirect("/");
}
