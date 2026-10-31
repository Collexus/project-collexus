import type { Metadata } from "next";
import { RegistrationHistory } from "./registration-history";

export const metadata: Metadata = {
  title: "Registrations & order history",
  description: "Review your Collexus event registrations and order history.",
};

export default function RegistrationsPage() {
  return <RegistrationHistory />;
}
