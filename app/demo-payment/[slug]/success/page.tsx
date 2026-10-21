import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { events, getEvent } from "@/data/events";
import { DemoPaymentSuccess } from "@/components/registration-demo-flow";

type DemoPaymentSuccessProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return events.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: DemoPaymentSuccessProps): Promise<Metadata> {
  const { slug } = await params;
  const event = getEvent(slug);
  return { title: event ? `Demo payment result · ${event.title}` : "Demo payment result" };
}

export default async function DemoPaymentSuccessPage({ params }: DemoPaymentSuccessProps) {
  const { slug } = await params;
  const event = getEvent(slug);
  if (!event) notFound();

  return <DemoPaymentSuccess event={{ slug: event.slug, title: event.title, dateLabel: event.dateLabel, audience: event.audience, fee: event.fee }} />;
}
