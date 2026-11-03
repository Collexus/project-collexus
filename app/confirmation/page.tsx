import type { Metadata } from "next";
import { ConfirmationExperience } from "./confirmation-experience";

export const metadata: Metadata = {
  title: "Confirmation",
  description: "Review your Collexus event, order, and request confirmation details.",
};

export default function ConfirmationPage() {
  return <ConfirmationExperience />;
}
