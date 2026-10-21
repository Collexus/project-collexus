import type { Metadata } from "next";
import { StallRegistrationForm } from "./stall-registration-form";

export const metadata: Metadata = {
  title: "Register a Stall",
  description: "Request a stall at a Collexus campus event.",
};

export default function StallRegistrationPage() {
  return <StallRegistrationForm />;
}
