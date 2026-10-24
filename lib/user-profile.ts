import type { SupabaseClient } from "@supabase/supabase-js";

export type AccountType = "student" | "faculty" | "guest";

export type UserProfile = {
  id: string;
  full_name: string | null;
  account_type: AccountType | null;
  campus_id: string | null;
  profile_domain: string | null;
  profile_skills: string[];
  profile_technologies: string[];
  profile_interests: string[];
  profile_about: string | null;
  profile_complete: boolean;
  profile_branch_category: string | null;
  profile_branch_details: string | null;
  profile_experience: string | null;
  profile_culture: string[];
  profile_favorite_foods: string[];
  created_at: string;
  updated_at: string;
};

export type UserProfileUpdate = Partial<Omit<UserProfile, "id" | "created_at" | "updated_at">>;

export async function getUserProfile(supabase: SupabaseClient, userId: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();

  return { profile: data as UserProfile | null, error };
}

export async function updateUserProfile(supabase: SupabaseClient, userId: string, updates: UserProfileUpdate) {
  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", userId)
    .select("*")
    .single();

  return { profile: data as UserProfile | null, error };
}
