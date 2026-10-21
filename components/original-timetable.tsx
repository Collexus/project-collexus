import Link from "next/link";
import { ArrowUpRight, CalendarDays } from "lucide-react";
import { events } from "@/data/events";

export function OriginalTimetable() {
  const datedEvents = events.filter((event) => event.dateStart);

  return (
    <section className="event-dates-section w-full px-gutter-desktop-wide max-w-[1920px] mx-auto py-space-xl" aria-labelledby="published-dates-heading">
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-space-md mb-space-lg">
        <div>
          <div className="flex items-center gap-2 mb-space-xs">
            <span className="w-8 h-px bg-secondary" />
            <span className="font-label-sm text-label-sm uppercase tracking-widest text-secondary font-bold">Official event records</span>
          </div>
          <h2 className="font-headline-lg text-headline-lg text-primary uppercase scroll-reveal" id="published-dates-heading">Published RCEE Event Dates</h2>
          <p className="font-body-sm text-body-sm text-on-surface-variant mt-space-xs max-w-2xl">Only events with a date in their public RCEE source are listed here.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-space-md">
        {datedEvents.map((event) => (
          <article className="event-date-card flex items-center gap-space-md p-space-md rounded-xl bg-surface-container-lowest border border-[#f4d3cb] shadow-sm" key={event.slug}>
            <span className="grid place-items-center shrink-0 w-12 h-12 rounded-lg bg-secondary-container text-primary">
              <CalendarDays size={20} aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <time className="font-label-sm text-label-sm uppercase tracking-wider text-secondary" dateTime={event.dateStart ?? undefined}>{event.dateLabel}</time>
              <h3 className="font-headline-sm text-headline-sm text-primary mt-1">{event.title}</h3>
            </div>
            <Link className="shrink-0 p-2 rounded hover:bg-surface-container text-secondary hover:text-primary transition-colors" href={`/events/${event.slug}`} aria-label={`View details for ${event.title}`}>
              <ArrowUpRight size={18} aria-hidden="true" />
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
