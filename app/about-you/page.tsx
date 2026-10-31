import type { Metadata } from "next";
import { ProfileExperience } from "../profile/profile-experience";

export const metadata: Metadata = {
  title: "About you",
  description: "Complete your Collexus profile with your contact details, campus information, interests and skills.",
};

export default function AboutYouPage() {
  return <ProfileExperience />;
}
