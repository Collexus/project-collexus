import type { Metadata } from "next";
import { ProfileExperience } from "./profile-experience";

export const metadata: Metadata = {
  title: "Your campus profile",
  description: "Set up your Collexus profile with your domain, skills and interests.",
};

export default function ProfilePage() {
  return <ProfileExperience />;
}
