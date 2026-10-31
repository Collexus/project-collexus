import type { Metadata } from "next";
import { ProfileSummary } from "./profile-summary";

export const metadata: Metadata = {
  title: "Your Collexus profile",
  description: "View your Collexus account, campus details, interests and skills.",
};

export default function ProfilePage() {
  return <ProfileSummary />;
}
