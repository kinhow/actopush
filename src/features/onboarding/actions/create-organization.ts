"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { onboardingSchema } from "../schemas/validation";
import type { OnboardingState } from "../types/state";

export async function createOrganization(
  _prevState: OnboardingState,
  formData: FormData
): Promise<OnboardingState> {
  const rawData = {
    fullName: formData.get("fullName"),
    orgName: formData.get("orgName"),
  };

  const result = onboardingSchema.safeParse(rawData);
  if (!result.success) {
    const { fieldErrors } = z.flattenError(result.error);
    return {
      success: false,
      errors: {
        fullName: fieldErrors.fullName?.[0],
        orgName: fieldErrors.orgName?.[0],
      },
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/signin");
  }

  const { error } = await supabase.rpc("complete_onboarding", {
    full_name: result.data.fullName,
    org_name: result.data.orgName,
  });

  if (error) {
    return {
      success: false,
      errors: { form: "Failed to set up workspace. Please try again." },
    };
  }

  revalidatePath("/", "layout");
  redirect("/");
}
