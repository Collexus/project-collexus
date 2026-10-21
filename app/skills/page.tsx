import type { Metadata } from "next";
import { SkillsExperience } from "./skills-experience";

export const metadata: Metadata = {
  title: "About you",
  description: "Create your Collexus profile with your branch, experience, skills, interests, culture and favorite foods.",
};

export default function SkillsPage() {
  return <SkillsExperience />;
}
