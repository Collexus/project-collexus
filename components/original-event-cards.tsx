import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, CalendarDays } from "lucide-react";
import { events } from "@/data/events";

const categories = {
  Hackathon: "hackathons",
  Workshop: "workshops",
  "Project expo": "branch",
  Cultural: "cultural",
} as const;

function pricingFilter(fee: string) {
  if (/₹|paid|pass fee/i.test(fee)) return "paid";
  if (/free/i.test(fee)) return "free";
  return "unknown";
}

export function OriginalEventCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-space-md" id="eventsGrid">
      {events.map((event) => {
        const pricing = pricingFilter(event.fee);
        const audience = event.audience === "RCEE students" ? "rcee" : event.audience === "External participants" ? "outside" : "rcee outside";
        const category = categories[event.category];

        return (
          <article
            className={`event-item event-tile event-${category} bg-surface-container-lowest rounded-2xl overflow-hidden shadow-sm border border-[#f4d3cb] flex flex-col group`}
            data-category={category}
            data-branch={event.branch.toLowerCase()}
            data-tracks={event.tracks.join("|")}
            data-audience={audience}
            data-pricing={pricing}
            data-entry={pricing}
            data-format={event.format.toLowerCase().replaceAll(/[^a-z0-9]+/g, "-")}
            key={event.slug}
          >
            <Link className="event-card-link flex flex-1 flex-col" href={`/events/${event.slug}`} aria-label={`View details for ${event.title}`}>
              <div className="event-tile-image relative w-full overflow-hidden">
                <Image
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.045]"
                  src={event.image}
                  alt=""
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
                <div className="event-tile-scrim" />
                <div className="event-tile-image-meta" aria-hidden="true">
                  <span className="event-tile-category">{event.category}</span>
                </div>
              </div>
              <div className="event-tile-content">
                <h3 className="event-tile-title">{event.title}</h3>
              </div>
              <div className="event-tile-footer">
                <p className="event-card-date flex items-center gap-2">
                  <CalendarDays size={16} aria-hidden="true" />
                  <time dateTime={event.dateStart ?? undefined}>{event.dateLabel}</time>
                </p>
                <span className="event-card-cta" aria-hidden="true">
                  <span>View details</span>
                  <ArrowUpRight size={16} />
                </span>
              </div>
            </Link>
          </article>
        );
      })}
    </div>
  );
}
