import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { events, getEvent } from "@/data/events";
import { RegistrationDemoForm } from "@/components/registration-demo-flow";

type RegistrationPageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return events.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: RegistrationPageProps): Promise<Metadata> {
  const { slug } = await params;
  const event = getEvent(slug);
  return { title: event ? `Register · ${event.title}` : "Registration preview" };
}

export default async function RegistrationPage({ params }: RegistrationPageProps) {
  const { slug } = await params;
  const event = getEvent(slug);
  if (!event) notFound();

  return <RegistrationDemoForm event={{ slug: event.slug, title: event.title, dateLabel: event.dateLabel, audience: event.audience, fee: event.fee }} />;
}
