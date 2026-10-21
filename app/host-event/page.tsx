import type { Metadata } from "next";
import { HostEventForm } from "./host-event-form";

export const metadata: Metadata = {
  title: "Host an Event",
  description: "Share your campus event with the Collexus community.",
};

export default function HostEventPage() {
  return <HostEventForm />;
}
