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

  const eventEnd = event.dateEnd ?? event.dateStart;
  const registrationClosed = /registration is closed/i.test(event.fee) || Boolean(eventEnd && eventEnd < new Date().toISOString().slice(0, 10));

  return <RegistrationDemoForm event={{ slug: event.slug, title: event.title, dateLabel: event.dateLabel, category: event.category, dateStart: event.dateStart, dateEnd: event.dateEnd, registrationClosed, audience: event.audience, fee: event.fee }} />;
}
