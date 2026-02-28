"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { signInSchema } from "../schemas/validation";
import { createClient } from "@/lib/supabase/server";
import type { SignInState } from "../types/state";
import { mapSignInError } from "../utils/errors";

export async function signIn(
  _prevState: SignInState,
  formData: FormData
): Promise<SignInState> {
  const rawData = {
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  };

  const result = signInSchema.safeParse(rawData);
  if (!result.success) {
    const { fieldErrors } = z.flattenError(result.error);
    return {
      success: false,
      errors: {
        email: fieldErrors.email?.[0],
        password: fieldErrors.password?.[0],
      },
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(result.data);

  if (error) {
    return {
      success: false,
      errors: mapSignInError(error.code, error.message),
    };
  }

  revalidatePath("/", "layout");
  redirect("/");
}
