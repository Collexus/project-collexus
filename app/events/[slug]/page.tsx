import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUpRight, CalendarDays, CircleCheck, ListChecks, MapPin, Users, WalletCards, TicketCheck } from "lucide-react";
import { events, getEvent } from "@/data/events";

type EventPageProps = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return events.map((event) => ({ slug: event.slug }));
}

export async function generateMetadata({ params }: EventPageProps): Promise<Metadata> {
  const { slug } = await params;
  const event = getEvent(slug);
  if (!event) return { title: "Event not found" };
  return { title: event.title, description: event.description, openGraph: { title: event.title, description: event.description, type: "article" } };
}

function formatTrack(track: string) {
  const labels: Record<string, string> = {
    iot: "IoT",
    "ai & data science": "AI & Data Science",
    "computer science & it": "CSE & IT",
    "electronics & communication": "ECE",
    "cyber security": "Cybersecurity",
    "embedded systems": "Embedded Systems",
    "software & it": "Software & IT",
    "campus & sports": "Campus & Sports",
    "campus & culture": "Campus & Culture",
    "arts & media": "Arts & Media",
  };
  return labels[track] ?? track.replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default async function EventDetailsPage({ params }: EventPageProps) {
  const { slug } = await params;
  const event = getEvent(slug);
  if (!event) notFound();

  return (
    <main className="details-page">
      <div className="details-topline">
        <Link href="/#featured-events" className="back-link"><ArrowLeft size={15} aria-hidden="true" /> Back to events</Link>
        <span className="record-label"><CircleCheck size={15} aria-hidden="true" /> VERIFIED EVENT RECORD</span>
      </div>

      <section className={`details-hero event-${event.category.toLowerCase().replaceAll(" ", "-")}`}>
        <div className="details-image">
          <Image src={event.image} alt="" fill priority sizes="(max-width: 850px) 100vw, 52vw" />
          <span className="details-image-label">{event.category} <span>·</span> RCEE</span>
          <div className="details-image-caption"><span>COLLEXUS EVENT GUIDE</span><strong>{event.branch} <i>TRACK</i></strong></div>
        </div>
        <div className="details-intro">
          <span className="details-kicker">{event.category} <span>·</span> {event.branch} track</span>
          <h1>{event.title}</h1>
          <div className="details-date"><CalendarDays size={17} aria-hidden="true" />{event.dateLabel}</div>
          <div className="details-track-tags" aria-label="Event topics">
            {event.tracks.slice(0, 4).map((track) => <span key={track}>{formatTrack(track)}</span>)}
          </div>
          <p>{event.description}</p>
          <div className="details-actions">
            <Link className="primary-button" href={`/events/${event.slug}/register`}><TicketCheck size={16} aria-hidden="true" /> {event.paymentUrl ? "Get registered" : "Register"} <span className="demo-action-tag">{event.paymentUrl ? "RAZORPAY" : "DEMO"}</span></Link>
          </div>
          <p className="archive-disclaimer">{event.paymentUrl ? "This is a historical event record. The supplied Razorpay link opens a hosted payment page; Collexus does not receive the payment result or confirm registration." : `Registration preview only. This demo does not submit an entry or charge money. ${event.dateStart ? "This dated event has concluded." : "The official listing does not publish an exact event date."}`}</p>
        </div>
      </section>

      <section className="details-snapshot" aria-label="Event at a glance">
        <div><span className="snapshot-icon"><CalendarDays size={17} aria-hidden="true" /></span><span><small>DATE</small><strong>{event.dateLabel}</strong></span></div>
        <div><span className="snapshot-icon"><MapPin size={17} aria-hidden="true" /></span><span><small>VENUE</small><strong>{event.venue}</strong></span></div>
        <div><span className="snapshot-icon"><Users size={17} aria-hidden="true" /></span><span><small>WHO IT’S FOR</small><strong>{event.audience}</strong></span></div>
        <div><span className="snapshot-icon"><WalletCards size={17} aria-hidden="true" /></span><span><small>ENTRY</small><strong>{event.fee}</strong></span></div>
      </section>

      <div className="details-content-grid">
        <section className="details-panel">
          <span className="eyebrow"><span className="eyebrow-line" /> EVENT OVERVIEW</span>
          <h2>What to know</h2>
          <p className="details-description">{event.description}</p>
          <div className="detail-divider" />
          <h3 className="highlight-heading"><ListChecks size={17} aria-hidden="true" /> Event highlights</h3>
          <ul className="highlight-list">{event.highlights.map((highlight) => <li key={highlight}><CircleCheck className="highlight-marker-icon" size={16} strokeWidth={1.8} aria-hidden="true" />{highlight}</li>)}</ul>
        </section>
        <aside className="facts-panel">
          <span className="eyebrow"><span className="eyebrow-line" /> EVENT INFORMATION</span>
          <h2>At a glance</h2>
          <dl className="event-facts">
            <div><dt>Organizer</dt><dd>{event.organizer}</dd></div>
            <div><dt>Format</dt><dd>{event.format}</dd></div>
            <div><dt>Department</dt><dd>{event.branch}</dd></div>
          </dl>
          <a className="source-inline-link" href={event.source} target="_blank" rel="noreferrer">Open original RCEE source <ArrowUpRight size={15} aria-hidden="true" /></a>
        </aside>
      </div>

      <div className="more-events"><div><span className="eyebrow"><span className="eyebrow-line" /> KEEP LOOKING</span><h2>Find your next <span>experience.</span></h2></div><Link href="/#featured-events" className="secondary-button">Browse all events <ArrowUpRight size={15} aria-hidden="true" /></Link></div>
    </main>
  );
}
