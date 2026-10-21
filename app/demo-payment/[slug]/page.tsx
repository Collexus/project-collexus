import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { events, getEvent } from "@/data/events";
import { DemoPaymentPanel } from "@/components/registration-demo-flow";

type DemoPaymentPageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return events.map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: DemoPaymentPageProps): Promise<Metadata> {
  const { slug } = await params;
  const event = getEvent(slug);
  return { title: event ? `Payment preview · ${event.title}` : "Payment preview" };
}

export default async function DemoPaymentPage({ params }: DemoPaymentPageProps) {
  const { slug } = await params;
  const event = getEvent(slug);
  if (!event) notFound();

  return <DemoPaymentPanel event={{ slug: event.slug, title: event.title, dateLabel: event.dateLabel, audience: event.audience, fee: event.fee }} />;
}
