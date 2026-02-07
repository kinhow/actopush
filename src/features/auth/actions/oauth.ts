"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function signInWithGoogle() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/verify/callback`,
    },
  });

  if (error) {
    redirect("/auth/error?message=Could not authenticate with Google");
  }

  if (data.url) {
    redirect(data.url);
  }
}
