"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowUpRight, CalendarDays, Code2, GraduationCap, Grid2X2, Lightbulb, PartyPopper, RotateCcw, Search, SlidersHorizontal, X } from "lucide-react";
import type { CampusEvent, EventBranch, EventCategory } from "@/data/events";
import { Button } from "@/components/ui/button";
import { FilterDialog } from "@/components/ui/dialog";
import { SelectField } from "@/components/ui/select";
import { TabsContent, TabsList, TabsRoot, TabsTrigger } from "@/components/ui/tabs";

type Props = { events: CampusEvent[] };
type CategoryFilter = EventCategory | "All events";
type BranchFilter = EventBranch | "All tracks";

const categories: CategoryFilter[] = ["All events", "Hackathon", "Workshop", "Project expo", "Cultural"];
const branches: BranchFilter[] = ["All tracks", "IoT", "Hardware", "Campus"];
const categoryIcons: Record<CategoryFilter, typeof Grid2X2> = {
  "All events": Grid2X2,
  Hackathon: Code2,
  Workshop: GraduationCap,
  "Project expo": Lightbulb,
  Cultural: PartyPopper,
};

type EventGridProps = { events: CampusEvent[]; onReset: () => void };

function EventGrid({ events: items, onReset }: EventGridProps) {
  if (!items.length) {
    return (
      <div className="empty-state">
        <span className="empty-icon"><Search size={28} aria-hidden="true" /></span>
        <h3>No events match those filters.</h3>
        <p>Try a broader search or clear the filters to see every listing.</p>
        <Button type="button" variant="secondary" onClick={onReset}>Show all events <RotateCcw size={14} aria-hidden="true" /></Button>
      </div>
    );
  }

  return (
    <div className="event-grid grid gap-5 md:grid-cols-2 xl:grid-cols-3">
      {items.map((event, index) => (
        <article className={`event-card flex flex-col overflow-hidden rounded-2xl border bg-white shadow-sm transition event-${event.category.toLowerCase().replaceAll(" ", "-")} ${index === 0 ? "event-card-featured" : ""}`} key={event.slug}>
          <Link href={`/events/${event.slug}`} className="event-card-image" aria-label={`View ${event.title}`}>
            <Image src={event.image} alt="" fill sizes="(max-width: 720px) 100vw, (max-width: 1100px) 50vw, 33vw" priority={index < 2} />
            <span className="image-sheen" />
          </Link>
          <div className="event-card-content">
            <h3><Link href={`/events/${event.slug}`}>{event.title}</Link></h3>
            <time className="event-date" dateTime={event.dateStart ?? undefined}>
              <CalendarDays size={16} aria-hidden="true" />
              {event.dateLabel}
            </time>
            <Link className="view-details" href={`/events/${event.slug}`}>View details <ArrowUpRight size={15} aria-hidden="true" /></Link>
          </div>
        </article>
      ))}
    </div>
  );
}

export function EventExplorer({ events }: Props) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CategoryFilter>("All events");
  const [branch, setBranch] = useState<BranchFilter>("All tracks");
  const [dateFilter, setDateFilter] = useState("all");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const filteredEvents = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return events.filter((event) => {
      const matchesQuery = !normalizedQuery || [event.title, event.category, event.branch, event.description, event.organizer]
        .join(" ").toLowerCase().includes(normalizedQuery);
      const matchesCategory = category === "All events" || event.category === category;
      const matchesBranch = branch === "All tracks" || event.branch === branch;
      const matchesDate = dateFilter === "all" || (dateFilter === "dated" ? Boolean(event.dateStart) : !event.dateStart);
      return matchesQuery && matchesCategory && matchesBranch && matchesDate;
    });
  }, [branch, category, dateFilter, events, query]);

  function resetFilters() {
    setQuery("");
    setCategory("All events");
    setBranch("All tracks");
    setDateFilter("all");
  }

  const filterFields = (
    <>
      <SelectField label="Track" value={branch} onValueChange={(value) => setBranch(value as BranchFilter)} options={branches.map((item) => ({ label: item, value: item }))} />
      <SelectField label="Date information" value={dateFilter} onValueChange={setDateFilter} options={[{ label: "All listings", value: "all" }, { label: "Dates published", value: "dated" }, { label: "Dates not listed", value: "undated" }]} />
    </>
  );

  return (
    <section className="events-section mx-auto" id="events" aria-labelledby="events-heading">
      <div className="section-heading">
        <div>
          <span className="eyebrow"><span className="eyebrow-line" /> THE EVENT ARCHIVE</span>
          <h2 id="events-heading">Find your next <span>big idea.</span></h2>
          <p>Browse verified campus events, then open a listing for the full details.</p>
        </div>
        <div className="archive-count"><strong>{filteredEvents.length.toString().padStart(2, "0")}</strong><span>verified<br />listings</span></div>
      </div>

      <div className="filter-panel space-y-3 rounded-2xl" aria-label="Event search and filters">
        <label className="search-field">
          <Search size={18} aria-hidden="true" />
          <span className="sr-only">Search events</span>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search events, topics, organizers…" />
          {query && <Button className="clear-search" variant="icon" type="button" onClick={() => setQuery("")} aria-label="Clear search"><X size={16} /></Button>}
        </label>

        <TabsRoot className="category-tabs-shell" value={category} onValueChange={(value) => setCategory(value as CategoryFilter)}>
          <TabsList aria-label="Filter by event category">
            {categories.map((item) => { const Icon = categoryIcons[item]; return <TabsTrigger key={item} value={item}><Icon size={14} aria-hidden="true" />{item}</TabsTrigger>; })}
          </TabsList>
          <TabsContent value={category} aria-label={`${category} listings`}>
            <div className="filter-row">
              {filterFields}
              <Button variant="ghost" type="button" className="reset-button" onClick={resetFilters}>Reset filters <RotateCcw size={14} aria-hidden="true" /></Button>
            </div>
            <div className="mobile-filter-control">
              <Button variant="secondary" type="button" onClick={() => setFiltersOpen(true)}><SlidersHorizontal size={15} aria-hidden="true" /> Filters{branch !== "All tracks" || dateFilter !== "all" ? <span className="filter-active-dot" /> : null}</Button>
              <span>{filteredEvents.length} results</span>
            </div>
            <EventGrid events={filteredEvents} onReset={resetFilters} />
          </TabsContent>
        </TabsRoot>
      </div>

      <FilterDialog open={filtersOpen} onOpenChange={setFiltersOpen} onReset={resetFilters}>
        {filterFields}
      </FilterDialog>

      <div className="sr-only" aria-live="polite">Showing {filteredEvents.length} events</div>
    </section>
  );
}


