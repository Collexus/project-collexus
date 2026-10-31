import type { Metadata } from "next";
import { ProfileExperience } from "../profile/profile-experience";

export const metadata: Metadata = {
  title: "Edit profile",
  description: "Update your Collexus profile details, interests and skills.",
};

export default function SkillsPage() {
  return <ProfileExperience />;
}
