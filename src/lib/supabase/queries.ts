import { cache } from "react";
import { createClient } from "./server";

/**
 * Cached per-request: returns the authenticated user.
 * Deduplicates across Sidebar, TopBar, and other server components.
 */
export const getUser = cache(async () => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

/**
 * Cached per-request: returns user profile (full_name, email).
 */
export const getUserProfile = cache(async (userId: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("users")
    .select("full_name, email")
    .eq("id", userId)
    .single();
  return data;
});

/**
 * Cached per-request: returns user profile with org membership.
 */
export const getUserWithOrg = cache(async (userId: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from("users")
    .select("full_name, email, org_memberships(organizations(name))")
    .eq("id", userId)
    .single();
  return data;
});
