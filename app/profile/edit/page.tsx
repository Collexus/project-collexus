import type { Metadata } from "next";
import { ProfileExperience } from "../profile-experience";

export const metadata: Metadata = {
  title: "Edit your Collexus profile",
  description: "Update your personal details, campus ID, phone number, interests and skills.",
};

export default function EditProfilePage() {
  return <ProfileExperience />;
}
