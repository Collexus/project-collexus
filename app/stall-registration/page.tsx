import type { Metadata } from "next";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { getUserProfile } from "@/lib/user-profile";
import { StallRegistrationForm, type StallContactProfile, type StallProfileState } from "./stall-registration-form";

export const metadata: Metadata = {
  title: "Register a Stall",
  description: "Request a stall at a Collexus campus event.",
};

export default async function StallRegistrationPage() {
  let contactProfile: StallContactProfile | null = null;
  let profileState: StallProfileState = "signed-out";

  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (!authError && user) {
      profileState = "unavailable";
      const { profile, error } = await getUserProfile(supabase, user.id);
      if (!error && profile) {
        const roles = {
          student: "Student or student team",
          faculty: "College department",
          guest: "External vendor",
        } as const;
        contactProfile = {
          contactName: profile.full_name?.trim() ?? "",
          role: profile.account_type ? roles[profile.account_type] ?? "" : "",
          organization: profile.profile_organization?.trim() ?? "",
          email: user.email?.trim() ?? "",
          phone: profile.profile_phone?.trim() || (user.phone_confirmed_at ? user.phone?.trim() ?? "" : ""),
        };
        profileState = "loaded";
      }
    }
  } catch {
    profileState = "unavailable";
  }

  return <StallRegistrationForm contactProfile={contactProfile} profileState={profileState} />;
}
