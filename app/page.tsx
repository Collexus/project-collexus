import Link from "next/link";
import { Icon } from "@/components/icon";
import { CollexusHomeLogo } from "@/components/collexus-home-logo";
import { HeaderAccountAction } from "@/components/header-account-action";
import { OriginalInteractions } from "@/components/original-interactions";
import { FaqAccordion } from "@/components/faq-accordion";
import { OriginalEventCards } from "@/components/original-event-cards";
import { OriginalTimetable } from "@/components/original-timetable";
import { events } from "@/data/events";

const publicBasePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export default function HomePage() {
  return (
    <>
      <OriginalInteractions />
      <header id="home" className="fixed top-0 w-full z-50 bg-surface/90 backdrop-blur-xl border-b border-[#f4d3cb]/70 shadow-[0_2px_14px_rgba(38,12,26,0.05)]">
  <div className="h-[72px] w-full px-3 sm:px-6 lg:px-8 max-w-[1920px] mx-auto flex items-center justify-between gap-2.5 sm:gap-4 lg:gap-6">
    
    <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
      <button id="mainMenuBtn" className="top-nav-btn menu-nav-btn" type="button" aria-label="Open campus navigation menu" title="Campus Navigation &amp; Filters Menu">
<Icon name="menu" className="menu-bars" />
        <span id="activeFilterBadge" className="filter-count-badge hidden">0</span>
      </button>

      <a className="collexus-brand flex items-center gap-0 shrink-0" data-path="discover" href="#" aria-label="Collexus home">
        <CollexusHomeLogo basePath={publicBasePath} wordmarkClassName="hidden md:inline-block" />
      </a>
    </div>

    
    <div className="header-search flex-1 max-w-[620px] mx-1 sm:mx-3 flex items-center relative">
      <Icon name="search" className="absolute left-3.5 text-secondary text-[19px] pointer-events-none" />
      <label className="sr-only" htmlFor="globalSearch">Search published events</label>
      <input className="w-full pl-10 pr-12 sm:pr-28 py-2.5 rounded-xl bg-white text-on-surface placeholder:text-on-surface-variant/70 border border-[#f0d4d8] font-body-sm text-body-sm focus:outline-none focus:border-dusty-rose focus:ring-4 focus:ring-[#edbfc6]/20 shadow-[0_2px_8px_rgba(38,12,26,0.04)] transition-all" id="globalSearch" aria-controls="searchSuggestions" aria-expanded="false" autoComplete="off" placeholder="Search events or topics…" type="search"/>
      <button id="clearGlobalSearch" className="global-search-clear" type="button" aria-label="Clear search" title="Clear search" hidden><Icon name="close" /></button>
      <div className="search-shortcut hidden sm:flex absolute right-2 items-center gap-1 px-1.5 py-1 rounded-lg bg-surface-container-low font-label-sm text-label-sm text-secondary pointer-events-none border border-[#f4d3cb]/60" aria-hidden="true"><kbd id="searchShortcutModifier">Ctrl</kbd><kbd>K</kbd></div>
      <div id="searchSuggestions" className="search-suggestions hidden" role="group" aria-label="Event search suggestions">
        <div className="search-suggestion-title">Explore categories</div>
        <button type="button" data-search="Hackathons"><Icon name="terminal" /><span>Hackathons</span><small>Build & compete</small></button>
        <button type="button" data-search="Internships"><Icon name="work" /><span>Internships</span><small>Career opportunities</small></button>
        <button type="button" data-search="Workshops"><Icon name="school" /><span>Workshops</span><small>Learn & upskill</small></button>
        <button type="button" data-search="Branch Events"><Icon name="hub" /><span>Branch Events</span><small>Department activities</small></button>
        <button type="button" data-search="Cultural Events"><Icon name="celebration" /><span>Cultural Events</span><small>Campus life</small></button>
        <button type="button" data-search="Outdoors"><Icon name="park" /><span>Outdoors</span><small>Outdoor campus activities</small></button>
        <div id="eventSearchResultGroup" className="event-search-result-group" hidden>
          <div className="search-suggestion-title">Matching events</div>
          {events.map((event) => {
            const categoryAlias = event.category === "Hackathon" ? "Hackathons" : event.category === "Workshop" ? "Workshops" : event.category === "Project expo" ? "Branch Events" : event.category === "Cultural" ? "Cultural Events" : "Special Events";
            const searchText = [event.title, event.category, categoryAlias, event.specialEvent ? "Special Events" : "", event.branch, event.tracks.join(" "), event.audience, event.organizer, event.venue, event.dateLabel, event.format, event.fee, event.description].join(" ");
            const icon = event.category === "Hackathon" ? "terminal" : event.category === "Workshop" ? "school" : event.category === "Project expo" ? "hub" : "celebration";

            return (
              <Link className="event-search-result" data-event-search-result="" data-event-search-key={searchText} href={`${publicBasePath}/events/${event.slug}/`} key={event.slug}>
                <span className="event-search-result-icon"><Icon name={icon} /></span>
                <span className="event-search-result-copy"><strong>{event.title}</strong><small>{event.category} · {event.dateLabel}</small></span>
                <Icon name="arrow_up_right" className="event-search-result-arrow" />
              </Link>
            );
          })}
        </div>
        <p id="searchSuggestionsEmpty" className="search-suggestion-empty" hidden>No matching events or categories. Try a title, topic, track, or organizer.</p>
      </div>
    </div>

    
    <div className="flex items-center gap-2 sm:gap-3 shrink-0">
      <div className="shrink-0 relative">
        <button id="calendarButton" className="calendar-btn" type="button" aria-label="Open calendar"><Icon name="calendar_month" /><span className="hidden sm:inline">Calendar</span></button>
      </div>
      <div className="shrink-0 relative">
        <HeaderAccountAction />
      </div>
    </div>
  </div>
</header><div className="quick-category-rail quick-category-top" id="quickCategories" aria-label="Explore event categories"><button data-search="Hackathons"><Icon name="terminal" /><span>Hackathons</span></button><button data-search="Internships"><Icon name="work" /><span>Internships</span></button><button data-search="Workshops"><Icon name="school" /><span>Workshops</span></button><button data-search="Branch Events"><Icon name="account_tree" /><span>Branch Events</span></button><button data-search="Cultural Events"><Icon name="celebration" /><span>Cultural Events</span></button><button data-search="Outdoors"><Icon name="park" /><span>Outdoors</span></button></div><main className="home-main w-full bg-surface min-h-[calc(100vh-280px)]"><div className="flex flex-col w-full">

<section className="reference-mood-backdrop relative w-full px-gutter-desktop-wide max-w-[1920px] mx-auto pt-5 sm:pt-6 pb-space-xl overflow-hidden bg-gradient-to-b from-[#FFF8F6] via-[#FFF1ED]/40 to-[#FFF8F6]">


<div className="absolute -top-24 -left-20 w-96 h-96 rounded-full bg-blush/35 blur-3xl pointer-events-none -z-10"></div>
<div className="absolute top-1/2 right-10 w-[30rem] h-[30rem] rounded-full bg-secondary-container/40 blur-3xl pointer-events-none -z-10"></div>
<div className="grid grid-cols-1 lg:grid-cols-12 gap-space-lg items-center">

<div className="lg:col-span-6 flex flex-col items-start pr-0 lg:pr-space-md">
<div className="inline-flex items-center gap-2 px-space-sm py-1 rounded-full bg-surface-container border border-[#f4d3cb] text-secondary font-label-sm text-label-sm uppercase tracking-widest mb-space-sm shadow-sm">
<Icon name="sensors" className="text-secondary text-[16px]" />
<span className="font-bold">Unified Collegiate Network v2.4</span>
</div>
<h1 className="hero-word-reveal font-display-hero text-display-hero uppercase tracking-tighter text-primary leading-[1.05] mb-space-md">
          YOUR CAMPUS.<br/>
<span className="text-secondary font-bold">YOUR PASSION.</span><br/>
          UNLEASHED.
        </h1>
<p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mb-space-lg">
          Explore published events from Ramachandra College of Engineering, from hands-on engineering workshops and project expos to hackathons and campus festivals. Open an event to review its details and source.
        </p>

<div className="flex flex-wrap items-center gap-space-sm w-full sm:w-auto mb-space-lg">
<a className="hero-cta relative overflow-hidden inline-flex items-center justify-center gap-space-xs px-space-lg py-3 rounded-lg bg-primary-container text-on-primary font-label-lg text-label-lg uppercase tracking-wider hover:bg-mocha hover:shadow-lg hover:-translate-y-0.5 transition-all shadow-md" href="#featured-events">
<span>Explore Event Records</span>
<Icon name="arrow_forward" className="text-[18px]" />
</a>
<a id="hostEventButton" href={`${publicBasePath}/host-event/`} className="hero-cta hero-cta-high-contrast host-event-cta relative overflow-hidden inline-flex items-center justify-center gap-space-xs px-space-lg py-3 rounded-lg bg-surface-container-lowest text-primary font-label-lg text-label-lg uppercase tracking-wider border transition-all group">
<Icon name="event_upcoming" className="text-secondary text-[20px]" />
<span>Host Event</span>
</a>
<a href={`${publicBasePath}/stall-registration/`} className="stall-registration-home-link" aria-label="Register a stall at a campus event">
<Icon name="storefront" /> <span>Register a stall</span> <Icon name="arrow_forward" />
</a>
</div>


<div className="flex flex-wrap items-center gap-space-md pt-space-xs">
<div className="flex items-center -space-x-3">
<img className="w-10 h-10 rounded-full object-cover shadow-sm ring-2 ring-[#f4d3cb]" alt="Student developer portrait with soft studio lighting wearing glasses and modern collegiate apparel against an architectural university background with muted blush and lavender tones" src="https://lh3.googleusercontent.com/aida-public/AB6AXuCIrR8y_xIIvWoK5MCSqqw9V2DUSAa3glNWONiErZhezAf0EyKFR00Ea2lnejm7f9Y-de8Op1iaUuM3V1csJfL6bHaPbp2-xVkHOiTzjqgmflHzRejWbgmfi19xQzTaQ5L73kEtkH7y6gWuY05f0elLnGXo1DDg7QTKWO2Na-qcjj3c5uD7hk8UlzCJKySFmKdWeMY_ryRawmZtC4s3fa9_trb2S7XNb7i7N81e7U-OhZX4SXddDdzc"/>
<img className="w-10 h-10 rounded-full object-cover shadow-sm ring-2 ring-[#f4d3cb]" alt="Young female biomedical engineering researcher in creative studio space smiling naturally in soft warm daylight with mauve and slate ambient backdrop" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAhWfgML-3KiJZrfAj-4RV85-wR9tPoNaz9c8cnzP2-xYwEv2THP7vrQFbFL0kOrrkofyzwizYik_R4DQOsnMEFUA3IFr1CqVwnIDbR-H8AUhL6EKwUPDNxiidRC9Z7Z0y9ZDFJNEgTmfIcA73HTwwkEaPncEfkmMoHI9rTiaX2DoyGsC_i3nEu4GP1nu23-xNVCUSebAUNNG34vqwdNhpsTSXzxrodqsyaRTiwEfNYxmISbN36bxwc"/>
<img className="w-10 h-10 rounded-full object-cover shadow-sm ring-2 ring-[#f4d3cb]" alt="University hackathon organizer smiling confidently holding laptop in contemporary library forum setting with midnight ink and orchid styling" src="https://lh3.googleusercontent.com/aida-public/AB6AXuBHirVuoomm1ectcNJOUHKtijKcl_fHtfQCoEhxxMfU7YI61UOCMAkAAuaMNvVvOcVMv-AId5cZO0OJWqfuXy96iAOms36Ije0F3JaEst_N_zfy40gG5AT9EMDer_i-vLWta31s_KaDe1Br_hj7rEWeTsrSBdabqCFbpYJWL8sfMzeBa-mONoohNIOroQtgjC0JaxUDzxpw1Av1og9-Djg9jH5FPmDr0dmkB6HLfUq7QNkJjD6pamvd"/>
<img className="w-10 h-10 rounded-full object-cover shadow-sm ring-2 ring-[#f4d3cb]" alt="Creative student designer in university fabrication lab working on digital hardware prototype with subtle ambient lighting" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDzEQo-F3ENKnO1mpjvTU_tQu-KLl-mbrDkbLid90nftxP_wlHcz9Fyn0NLQBOXA_Dp6QhFdNFzxlc4WliN2Cibl0cZd3nPzuHhN677vblTxnJxWWPBuURWf0fkAAfam3QbuXEMwvZ4qShe0vvvRPu7geHqYbw-ICp6i2FzwfrKHlNNrHWAO45MMNDedalb41NIZTw7qtIwAfezAgq2KG35JKZeHYqLqaotgNAX7wmTiPwCi74GBUVX"/>
<div className="w-10 h-10 rounded-full bg-primary-container text-blush font-label-sm text-label-sm flex items-center justify-center font-bold ring-2 ring-[#f4d3cb] shadow-sm">
              RCEE
            </div>
</div>
<div className="flex flex-col">
<div className="flex items-center gap-1.5 font-label-md text-label-md text-primary font-bold">
<span>Event details linked to RCEE sources</span>
<Icon name="verified" className="text-secondary text-[18px]" />
</div>
<span className="font-body-sm text-body-sm text-on-surface-variant">Dates and details shown where published</span>
</div>
</div>
</div>

<div className="lg:col-span-6 relative mt-space-lg lg:mt-0">
<div className="featured-event-panel relative rounded-xl bg-surface-container-lowest backdrop-blur-md shadow-xl border border-[#f4d3cb] overflow-hidden p-space-md">

<div className="flex items-center justify-between pb-space-sm mb-space-sm border-b border-[#f4d3cb]/50">
<div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-primary text-on-primary font-label-sm text-label-sm uppercase tracking-wider">
<span className="w-2 h-2 rounded-full bg-blush animate-ping"></span>
<span>RCEE cultural event</span>
</div>
<div className="flex items-center gap-1 text-secondary font-label-sm text-label-sm uppercase font-semibold">
<Icon name="location_on" className="text-[16px]" />
<span>Ramachandra College of Engineering</span>
</div>
</div>

<div className="relative w-full h-80 rounded-lg overflow-hidden mb-space-md border border-[#f4d3cb]">
<img className="w-full h-full object-cover" alt="Students enjoying a live band performance at an outdoor college cultural festival" src={`${publicBasePath}/assets/kreya-26-cultural-fest.webp`}/>
<div className="absolute inset-0 bg-gradient-to-t from-primary/95 via-primary/40 to-transparent"></div>
<div className="feature-kind-badge absolute top-3 left-3 px-2 py-1 rounded font-label-sm text-label-sm uppercase tracking-wider font-bold">
              Annual cultural fest
            </div>
<div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
<div>
<h3 className="font-headline-md text-headline-md text-white font-bold flagship-aura-title">KREYA ’27 Cultural Fest</h3>
<p className="font-body-sm text-body-sm text-blush">Art, music, literature, culture &amp; technical excellence</p>
</div>
<span className="px-2 py-1 rounded bg-blush text-primary font-label-sm text-label-sm font-bold uppercase shrink-0">KREYA ’27</span>
</div>
</div>

<div className="bg-surface-container-low rounded-lg p-space-sm mb-space-md border border-[#f4d3cb]/60">
<div className="flex items-center justify-between mb-2">
<span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider font-semibold">Published event details</span>
<span className="font-label-sm text-label-sm text-primary font-bold">Date not listed by RCEE</span>
</div>
<div className="grid grid-cols-2 gap-2 text-center">
<div className="featured-detail-stat py-3 rounded shadow-sm border">
<span className="font-headline-sm text-headline-sm font-bold text-primary block">5th</span>
<span className="font-label-sm text-label-sm text-secondary uppercase">Edition</span>
</div>
<div className="featured-detail-stat py-3 rounded shadow-sm border">
<span className="font-headline-sm text-headline-sm font-bold text-primary block">RCEE</span>
<span className="font-label-sm text-label-sm text-secondary uppercase">Organizer</span>
</div>
</div>
</div>

<div className="space-y-space-xs">
<div className="flex items-center justify-between font-label-sm text-label-sm">
<span className="text-secondary uppercase font-semibold">KREYA event record</span>
<span className="text-primary font-bold">Review official details</span>
</div>
<div className="pt-space-xs flex items-center justify-between gap-space-sm">
<div className="flex items-center gap-1.5 text-secondary font-body-sm text-body-sm">
<Icon name="verified" className="text-[16px] text-emerald-700" />
<span>Source-linked information</span>
</div>
<a className="featured-event-action" href={`${publicBasePath}/events/kreya-26-cultural-fest/`}>View details<Icon name="arrow_forward" aria-hidden="true" /></a>
</div>
</div>
</div>
</div>
</div>
</section>

<section className="event-stats-section w-full px-gutter-desktop-wide max-w-[1920px] mx-auto py-space-lg">
<div className="event-stats-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-space-md">

<div className="event-stat-card bg-surface-container-lowest rounded-xl p-space-md shadow-sm border border-[#f4d3cb] flex flex-col justify-between group transition-all">
<div className="flex items-center justify-between mb-space-sm">
<span className="p-2 rounded-lg bg-surface-container text-primary">
<Icon name="school" className="text-[24px]" />
</span>
<span className="font-label-sm text-label-sm px-2 py-0.5 rounded-full bg-secondary-container text-primary font-semibold uppercase">RCEE Source Records</span>
</div>
<div>
<div className="font-headline-lg text-headline-lg text-primary tracking-tight font-bold">{events.length}</div>
<div className="font-label-lg text-label-lg text-secondary uppercase tracking-wider mt-0.5 font-semibold">Published event records</div>
<p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Events summarized from public RCEE event pages and reports.</p>
</div>
</div>

<div className="event-stat-card bg-surface-container-lowest rounded-xl p-space-md shadow-sm border border-[#f4d3cb] flex flex-col justify-between group transition-all">
<div className="flex items-center justify-between mb-space-sm">
<span className="p-2 rounded-lg bg-surface-container text-primary">
<Icon name="calendar_month" className="text-[24px]" />
</span>
<span className="font-label-sm text-label-sm px-2 py-0.5 rounded-full bg-surface-container text-secondary font-semibold uppercase">Verified dates</span>
</div>
<div>
<div className="font-headline-lg text-headline-lg text-primary tracking-tight font-bold">{events.filter((event) => event.dateStart).length}</div>
<div className="font-label-lg text-label-lg text-secondary uppercase tracking-wider mt-0.5 font-semibold">Records with event dates</div>
<p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Other official listings do not publish exact dates.</p>
</div>
</div>

<div className="event-stat-card bg-surface-container-lowest rounded-xl p-space-md shadow-sm border border-[#f4d3cb] flex flex-col justify-between group transition-all">
<div className="flex items-center justify-between mb-space-sm">
<span className="p-2 rounded-lg bg-surface-container text-primary">
<Icon name="payments" className="text-[24px]" />
</span>
<span className="font-label-sm text-label-sm px-2 py-0.5 rounded-full bg-blush text-primary font-bold uppercase">Event mix</span>
</div>
<div>
<div className="font-headline-lg text-headline-lg text-primary tracking-tight font-bold">{new Set(events.map((event) => event.category)).size}</div>
<div className="font-label-lg text-label-lg text-secondary uppercase tracking-wider mt-0.5 font-semibold">Event categories</div>
<p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Hackathons, workshops, project expos and cultural events.</p>
</div>
</div>

<div className="event-stat-card bg-surface-container-lowest rounded-xl p-space-md shadow-sm border border-[#f4d3cb] flex flex-col justify-between group transition-all">
<div className="flex items-center justify-between mb-space-sm">
<span className="p-2 rounded-lg bg-surface-container text-primary">
<Icon name="qr_code_scanner" className="text-[24px]" />
</span>
<span className="font-label-sm text-label-sm px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 uppercase font-bold">Prototype</span>
</div>
<div>
<div className="font-headline-lg text-headline-lg text-primary tracking-tight font-bold">QR</div>
<div className="font-label-lg text-label-lg text-secondary uppercase tracking-wider mt-0.5 font-semibold">Digital pass demo</div>
<p className="font-body-sm text-body-sm text-on-surface-variant mt-1">Preview the local pass flow; registration is not connected to RCEE.</p>
</div>
</div>
</div>
</section>


<section className="motion-showcase-section" aria-label="Motion highlights">
  <div className="showcase-inner">
    <div className="showcase-heading scroll-reveal">
      
      <h2>Discover events that move with you.</h2>
      <p>Interactive previews, smooth transitions and clear categories make campus discovery feel effortless.</p>
    </div>
    <div className="coverflow" id="eventCoverflow" aria-label="Featured event carousel">
      {events.slice(0, 4).map((event, index) => (
        <article className={`cover-card${index === 0 ? " is-active" : ""}`} key={event.slug}>
          <div className="cover-icon"><Icon name={["bolt", "school", "sensors", "sports_cricket"][index]} /></div>
          <span>{event.category.toUpperCase()} · RCEE</span>
          <h3>{event.title}</h3>
          <p>{event.dateLabel} · {event.format}</p>
          <a className="premium-btn small" href={`${publicBasePath}/events/${event.slug}/`}>View details <Icon name="arrow_up_right" /></a>
        </article>
      ))}
    </div>
    <div className="cover-controls"><button id="coverPrev" aria-label="Previous"><Icon name="arrow_back" /></button><div id="coverDots"></div><button id="coverNext" aria-label="Next"><Icon name="arrow_forward" /></button></div>
  </div>
</section>


<section className="w-full px-gutter-desktop-wide max-w-[1920px] mx-auto py-space-xl" id="featured-events">
<div className="flex flex-col md:flex-row md:items-end justify-between mb-space-lg gap-space-sm">
<div>
<div className="inline-flex items-center gap-1.5 font-label-sm text-label-sm uppercase tracking-widest text-secondary font-bold mb-1">
<Icon name="local_activity" className="text-[16px]" />
<span>Collegiate Schedule Feed</span>
</div>
<h2 className="font-headline-lg text-headline-lg text-primary uppercase scroll-reveal">Published RCEE Event Records</h2>
</div>
<div className="flex items-center gap-2">
  <button id="sectionFilterBtn" className="top-nav-btn filter-nav-btn" type="button" aria-label="Open event filters">
    <Icon name="tune" />
    <span>Filter Feed</span>
    <span id="filterCountLabel" className="filter-count-label hidden" aria-live="polite"></span>
  </button>
</div>
</div>

<p id="eventResultsStatus" className="event-results-status font-body-sm text-on-surface-variant" role="status" aria-live="polite" aria-atomic="true">Showing all {events.length} published event records.</p>

<OriginalEventCards />

<div className="event-list-more-wrap">
  <button id="toggleEventRows" className="event-list-more" type="button" aria-expanded="false" aria-controls="eventsGrid">
    <span>Show all {events.length} events</span><Icon name="expand_more" aria-hidden="true" />
  </button>
</div>


<div id="noFilteredEvents" className="hidden text-center py-16 px-6 bg-surface-container-lowest rounded-2xl border border-[#f4d3cb] mt-4">
  <Icon name="filter_alt_off" className="text-4xl text-secondary mb-2 block" />
  <h4 className="font-headline-sm text-headline-sm text-primary font-bold">No matching experiences found</h4>
  <p id="noFilteredEventsHint" className="text-sm text-on-surface-variant max-w-md mx-auto mt-1 mb-4">Try a broader search or clear the filters to see the full schedule.</p>
  <button id="resetFromEmptyBtn" className="top-nav-btn is-active" type="button">Clear Search &amp; Filters</button>
</div>

</section>

<section className="campus-identity-section w-full px-gutter-desktop-wide max-w-[1920px] mx-auto py-space-xl bg-surface-container-low border border-[#f4d3cb] my-space-lg rounded-3xl">
<div className="text-center max-w-3xl mx-auto mb-space-xl">
<div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blush/80 text-primary font-label-sm text-label-sm uppercase tracking-wider mb-space-xs font-bold border border-dusty-rose/40">
<Icon name="badge" className="text-[16px]" />
<span>Collegiate Sovereign Identity</span>
</div>
<h2 className="font-headline-lg text-headline-lg text-primary uppercase">Engineered For The Frictionless Campus</h2>
<p className="font-body-md text-body-md text-on-surface-variant mt-2">
        Browse public RCEE event listings, filter by event type and track, and follow source links for the latest schedules. Digital passes on this page are a local demonstration and are not connected to event registration.
      </p>
</div>

<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-space-md">

<div className="editorial-info-card bg-surface-container-lowest p-space-lg rounded-xl shadow-sm hover:shadow-md border border-[#f4d3cb] flex flex-col justify-between">
<div>
<div className="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center text-primary mb-space-md border border-[#f4d3cb]/60">
<Icon name="wallet" className="text-[28px]" />
</div>
<h4 className="font-headline-sm text-headline-sm text-primary mb-space-xs">Official event sources</h4>
<p className="font-body-sm text-body-sm text-on-surface-variant">
            Open the original RCEE event page or report directly from each event details page.
          </p>
</div>
<div className="pt-space-md flex items-center gap-2 text-secondary font-label-sm text-label-sm uppercase tracking-wider font-semibold">
<Icon name="bolt" className="text-secondary text-[16px]" />
<span>Source-linked details</span>
</div>
</div>

<div className="editorial-info-card bg-surface-container-lowest p-space-lg rounded-xl shadow-sm hover:shadow-md border border-[#f4d3cb] flex flex-col justify-between">
<div>
<div className="w-12 h-12 rounded-xl bg-secondary-container text-primary flex items-center justify-center mb-space-md border border-dusty-rose/30">
<Icon name="hub" className="text-[28px]" />
</div>
<h4 className="font-headline-sm text-headline-sm text-primary mb-space-xs">Event filters</h4>
<p className="font-body-sm text-body-sm text-on-surface-variant">
            Narrow the event list by category, audience, fee information or department track.
          </p>
</div>
<div className="pt-space-md flex items-center gap-2 text-secondary font-label-sm text-label-sm uppercase tracking-wider font-semibold">
<Icon name="groups" className="text-secondary text-[16px]" />
<span>Filter the event list</span>
</div>
</div>

<div className="editorial-info-card bg-surface-container-lowest p-space-lg rounded-xl shadow-sm hover:shadow-md border border-[#f4d3cb] flex flex-col justify-between">
<div>
<div className="w-12 h-12 rounded-xl bg-blush text-primary flex items-center justify-center mb-space-md border border-dusty-rose/40">
<Icon name="shield_person" className="text-[28px]" />
</div>
<h4 className="font-headline-sm text-headline-sm text-primary mb-space-xs">Published dates</h4>
<p className="font-body-sm text-body-sm text-on-surface-variant">
            Dates appear only when they are stated in the public event source. Listings without a published date are labeled clearly.
          </p>
</div>
<div className="pt-space-md flex items-center gap-2 text-secondary font-label-sm text-label-sm uppercase tracking-wider font-semibold">
<Icon name="fingerprint" className="text-secondary text-[16px]" />
<span>Source-based listings</span>
</div>
</div>

<div className="editorial-info-card bg-surface-container-lowest p-space-lg rounded-xl shadow-sm hover:shadow-md border border-[#f4d3cb] flex flex-col justify-between">
<div>
<div className="w-12 h-12 rounded-xl bg-surface-container text-primary flex items-center justify-center mb-space-md border border-[#f4d3cb]/60">
<Icon name="workspace_premium" className="text-[28px]" />
</div>
<h4 className="font-headline-sm text-headline-sm text-primary mb-space-xs">Event details</h4>
<p className="font-body-sm text-body-sm text-on-surface-variant">
            Review each event’s format, organizer, audience, venue and other details supplied in its RCEE listing.
          </p>
</div>
<div className="pt-space-md flex items-center gap-2 text-secondary font-label-sm text-label-sm uppercase tracking-wider font-semibold">
<Icon name="share" className="text-secondary text-[16px]" />
<span>Organizer &amp; venue information</span>
</div>
</div>
</div>
</section>

<OriginalTimetable />





</div></main>

<section id="categoryViews" className="category-views hidden" aria-live="polite">
  <div className="category-page-shell">
    <nav className="category-section-nav" aria-label="Event sections">
      <button type="button" data-category-nav="Hackathons"><Icon name="terminal" />Hackathons</button>
      <button type="button" data-category-nav="Internships"><Icon name="work" />Internships</button>
      <button type="button" data-category-nav="Workshops"><Icon name="school" />Workshops</button>
      <button type="button" data-category-nav="Branch Events"><Icon name="hub" />Branch Events</button>
      <button type="button" data-category-nav="Cultural Events"><Icon name="celebration" />Cultural Events</button>
      <button type="button" data-category-nav="Outdoors"><Icon name="park" />Outdoors</button>
      <button type="button" id="categoryPassesNav"><Icon name="qr_code_2" />Get Passes</button>
    </nav>
    <div className="category-page-top">
      <button id="categoryBack" className="back-btn" type="button"><Icon name="arrow_back" /> Back to home</button>
      <span className="category-kicker">COLLEXUS DISCOVERY</span>
    </div>
    <div className="category-heading">
      <div><p id="categoryEyebrow" className="category-eyebrow">EXPLORE</p><h2 id="categoryTitle">Hackathons</h2><p id="categoryPunchline" className="category-punchline">Build bold. Break limits. Ship what matters.</p><p id="categoryDescription">Find events that match your interests.</p></div>
    </div>
    <div id="categoryCards" className="category-cards"></div>
  </div>
</section>


<div id="loginModal" className="login-modal hidden" aria-hidden={true}>
  <div className="login-backdrop" data-close-login></div>
  <div className="login-dialog" role="dialog" aria-modal="true" aria-labelledby="loginTitle">
    <button className="login-back-icon hidden" type="button" data-login-back aria-label="Back to login choices"><Icon name="arrow_back" aria-hidden="true" /></button>
    <button className="login-close" type="button" data-close-login aria-label="Close"><Icon name="close" /></button>
    <div className="login-dialog-logo"><span className="college-logo-wrap"><img src={`${publicBasePath}/collexus-logo.svg`} alt="Collexus logo" className="college-logo"/></span><span className="collexus-word">Collexus</span></div>
    <p className="category-eyebrow">ACCOUNT ACCESS</p><h2 id="loginTitle">Login / Sign Up</h2><p className="login-subtitle">Choose an account type. Account creation is not connected in this static demo.</p>
    <div className="login-options">
      <button className="login-option" type="button" data-login-type="student"><span className="option-icon"><Icon name="school" /></span><span><strong>Student Login</strong><small>For students to register and manage events</small></span><Icon name="arrow_forward" /></button>
      <button className="login-option" type="button" data-login-type="faculty"><span className="option-icon"><Icon name="badge" /></span><span><strong>Faculty Login</strong><small>For faculty coordinators</small></span><Icon name="arrow_forward" /></button>
      <button className="login-option" type="button" data-login-type="event-register"><span className="option-icon"><Icon name="event_available" /></span><span><strong>Register Event</strong><small>Fill the form to register for a campus event</small></span><Icon name="arrow_forward" /></button>
    </div>
    <div id="hostEventPanel" className="host-event-panel hidden" role="status" aria-live="polite"><h3>Host a campus event</h3><p>Organizer submissions are not connected in this static demo. No event details will be sent.</p><button className="login-auth-back" type="button" data-login-back><Icon name="arrow_back" /> Back to account options</button></div>
    <form id="studentLoginForm" className="login-auth-form">
      <h3 className="login-auth-title">Student Login</h3>
      <p className="login-auth-sub">Sign in to register for events, view your calendar and manage your pass.</p>
      <div className="login-auth-grid">
        <label>College ID<input name="studentId" autoComplete="username" required minLength={5} maxLength={20} placeholder="e.g. 23CSP001" /></label>
        <label>Mail<input name="studentEmail" type="email" autoComplete="email" required maxLength={254} placeholder="student@college.edu" /></label>
        <label>Password<input name="studentPassword" type="password" autoComplete="current-password" required minLength={8} maxLength={128} placeholder="Enter password" /></label>
      </div>
      <button className="login-auth-submit" type="submit">Login as Student</button>
      <button className="login-auth-back" type="button" data-login-back><Icon name="arrow_back" /> Choose another login</button>
    </form>
    <form id="facultyLoginForm" className="login-auth-form">
      <h3 className="login-auth-title">Faculty Login</h3>
      <p className="login-auth-sub">Sign in to coordinate events and manage registrations.</p>
      <div className="login-auth-grid">
        <label>Faculty ID<input name="facultyId" autoComplete="username" required minLength={4} maxLength={20} placeholder="e.g. FAC001" /></label>
        <label>Mail<input name="facultyEmail" type="email" autoComplete="email" required maxLength={254} placeholder="faculty@college.edu" /></label>
        <label>Password<input name="facultyPassword" type="password" autoComplete="current-password" required minLength={8} maxLength={128} placeholder="Enter password" /></label>
      </div>
      <button className="login-auth-submit" type="submit">Login as Faculty</button>
      <button className="login-auth-back" type="button" data-login-back><Icon name="arrow_back" /> Choose another login</button>
    </form>
    <div id="eventRegistrationPanel" className="login-registration-panel hidden">
      <h3 className="login-auth-title">Register Event</h3>
      <p className="login-auth-sub">Choose an event and submit your details to register.</p>
    <form id="eventRegistrationForm" className="login-registration-form">
      <div className="login-form-grid">
        <label>Full name<input name="name" required placeholder="Your full name" /></label>
        <label>Email<input name="email" type="email" required placeholder="you@example.com" /></label>
        <label>College / Organization<input name="college" required placeholder="College name" /></label>
        <label>Phone<input name="phone" required placeholder="10-digit mobile number" /></label>
        <label>Event<select name="event" id="loginEventSelect" required></select></label>
        <label>Pass type<select name="passType"><option value="student">Student Pass</option><option value="outer">Outer Pass</option></select></label>
      </div>
      <button className="login-register-submit" type="submit">Register for Event <Icon name="arrow_forward" /></button>
      <button className="login-auth-back" type="button" data-event-register-back><Icon name="arrow_back" /> Choose another option</button>
    </form>
    </div>
    <div id="loginFormHint" className="login-form-hint hidden" role="status" aria-live="polite"></div>
  </div>
</div>



<div id="campusMenuDrawer" className="menu-drawer hidden" aria-hidden={true}>
  <div className="menu-drawer-backdrop" data-close-menu></div>
  <div className="menu-drawer-panel" role="dialog" aria-modal="true" aria-label="Event filters">
    
    
    <div className="menu-drawer-header">
      <div className="menu-header-brand">
        <span className="college-logo-wrap menu-brand-mark">
          <img src={`${publicBasePath}/collexus-logo.svg`} alt="" className="college-logo"/>
        </span>
        <div className="menu-brand-copy">
          <div className="menu-brand-title">
            <strong className="collexus-word">COLLEXUS</strong>
            <span className="live-status-pill">EVENTS</span>
          </div>
          <small className="menu-brand-subtitle">RAMACHANDRA COLLEGE OF ENGINEERING</small>
        </div>
      </div>
      <button className="menu-close-btn" type="button" data-close-menu aria-label="Close menu">
        <Icon name="close" className="text-[18px]" />
      </button>
    </div>
    <div className="menu-drawer-body filter-panel">
      <div className="filter-panel-heading">
        <span className="filter-panel-symbol"><Icon name="tune" /></span>
        <div className="filter-panel-copy"><p>EVENT DISCOVERY</p><h2>Find your events</h2><span>Choose a few details to narrow the schedule.</span></div>
        <span id="filterActiveCount" className="filter-active-count hidden">0 active</span>
      </div>

      <div id="menuContentFilters" className="menu-tab-content filter-panel-groups">
        <section className="filter-group-card">
          <div className="filter-group-heading"><span className="filter-group-icon"><Icon name="groups" /></span><div><h3>Who can attend?</h3><p>RCEE students or guests from outside.</p></div></div>
          <div className="menu-filter-chips" data-filter-group="audience">
            <button className="menu-filter-chip active" type="button" data-filter-val="all"><Icon name="apps" />All events</button>
            <button className="menu-filter-chip" type="button" data-filter-val="rcee"><Icon name="school" />RCEE students</button>
            <button className="menu-filter-chip" type="button" data-filter-val="outside"><Icon name="public" />Outside participants</button>
          </div>
        </section>

        <section className="filter-group-card">
          <div className="filter-group-heading"><span className="filter-group-icon"><Icon name="payments" /></span><div><h3>Event cost</h3><p>Fee ranges use the amounts in each event listing.</p></div></div>
          <div className="menu-filter-chips" data-filter-group="pricing">
            <button className="menu-filter-chip active" type="button" data-filter-val="all"><Icon name="apps" />Any cost</button>
            <button className="menu-filter-chip" type="button" data-filter-val="free"><Icon name="check_circle" />Free</button>
            <button className="menu-filter-chip" type="button" data-filter-val="paid"><Icon name="confirmation_number" />Paid</button>
            <button className="menu-filter-chip" type="button" data-filter-val="under-250"><Icon name="payments" />Under ₹250</button>
            <button className="menu-filter-chip" type="button" data-filter-val="under-500"><Icon name="payments" />Under ₹500</button>
          </div>
        </section>

        <section className="filter-group-card">
          <div className="filter-group-heading"><span className="filter-group-icon"><Icon name="category" /></span><div><h3>Event type</h3><p>Browse the kind of experience you want.</p></div></div>
          <div className="menu-filter-chips" data-filter-group="category">
            <button className="menu-filter-chip active" type="button" data-filter-val="all"><Icon name="apps" />All types</button>
            <button className="menu-filter-chip" type="button" data-filter-val="hackathons"><Icon name="terminal" />Hackathons</button>
            <button className="menu-filter-chip" type="button" data-filter-val="workshops"><Icon name="school" />Workshops</button>
            <button className="menu-filter-chip" type="button" data-filter-val="branch"><Icon name="account_tree" />Project expos</button>
            <button className="menu-filter-chip" type="button" data-filter-val="cultural"><Icon name="celebration" />Cultural</button>
            <button className="menu-filter-chip" type="button" data-filter-val="special"><Icon name="celebration" />Special events</button>
            <button className="menu-filter-chip" type="button" data-filter-val="outdoors"><Icon name="park" />Outdoors</button>
          </div>
        </section>

        <section className="filter-group-card">
          <div className="filter-group-heading"><span className="filter-group-icon"><Icon name="hub" /></span><div><h3>Department &amp; interest</h3><p>Match published events to your field or creative focus.</p></div></div>
          <div className="menu-filter-chips" data-filter-group="branch">
            <button className="menu-filter-chip active" type="button" data-filter-val="all">All tracks</button>
            <button className="menu-filter-chip" type="button" data-filter-val="computer science & it">CSE &amp; IT</button>
            <button className="menu-filter-chip" type="button" data-filter-val="ai & data science">AIML / AI &amp; Data Science</button>
            <button className="menu-filter-chip" type="button" data-filter-val="electronics & communication">ECE</button>
            <button className="menu-filter-chip" type="button" data-filter-val="electrical engineering">EEE</button>
            <button className="menu-filter-chip" type="button" data-filter-val="mechanical engineering">Mechanical</button>
            <button className="menu-filter-chip" type="button" data-filter-val="civil engineering">Civil</button>
            <button className="menu-filter-chip" type="button" data-filter-val="iot">IoT</button>
            <button className="menu-filter-chip" type="button" data-filter-val="embedded systems">Embedded</button>
            <button className="menu-filter-chip" type="button" data-filter-val="cyber security">Cybersecurity</button>
            <button className="menu-filter-chip" type="button" data-filter-val="ui/ux design">UI/UX design</button>
            <button className="menu-filter-chip" type="button" data-filter-val="arts & media">Arts &amp; media</button>
            <button className="menu-filter-chip" type="button" data-filter-val="video editing">Video editing</button>
            <button className="menu-filter-chip" type="button" data-filter-val="bba">BBA</button>
            <button className="menu-filter-chip" type="button" data-filter-val="mba">MBA</button>
          </div>
        </section>

        <div className="filter-panel-note"><Icon name="info" /><span>Some event pages don’t publish dates or fees. We show what the official listing confirms.</span></div>
        <div className="menu-filter-actions filter-panel-actions">
          <button id="resetFiltersBtn" className="menu-filter-reset-btn" type="button"><Icon name="restart_alt" />Reset</button>
          <button id="applyFiltersBtn" className="menu-filter-apply-btn" type="button"><Icon name="check_circle" className="text-[16px]" /><span>Show results</span><span id="filterPreviewCount" className="filter-preview-count"></span></button>
        </div>
      </div>

    </div>

    
    <div className="menu-drawer-footer">
      <div className="theme-switch-row">
        <span className="theme-switch-label">Display theme</span>
        <button id="themeToggleBtn" className="theme-toggle" type="button" role="switch" aria-checked="false" aria-label="Day theme is off">
          <span className="theme-toggle-track" aria-hidden="true"><span className="theme-toggle-thumb"><Icon name="dark_mode" /></span></span>
          <span id="themeToggleLabel">Dark</span>
        </button>
      </div>
      <div className="flex items-center justify-between text-[11px] text-stone-500 font-medium">
        <span>Ramachandra College of Engg.</span>
        <span className="menu-version-pill px-1.5 py-0.5 rounded font-bold text-[9px]">v2.4 Live</span>
      </div>
    </div>

  </div>
</div>


<div id="calendarModal" className="calendar-modal hidden" aria-hidden={true}>
  <div className="calendar-backdrop" data-close-calendar></div>
  <div className="calendar-dialog" role="dialog" aria-modal="true" aria-labelledby="calendarTitle">
    <div className="calendar-top"><div><p className="category-eyebrow">EVENT DATE &amp; PASS DEMO</p><h2 id="calendarTitle">Event dates</h2><p>Published RCEE dates and locally saved pass demo entries appear here. Demo entries are not event registrations.</p></div><div className="calendar-nav"><button id="calPrev" type="button" aria-label="Previous month"><Icon name="arrow_back" /></button><button id="calNext" type="button" aria-label="Next month"><Icon name="arrow_forward" /></button><button id="calClose" type="button" aria-label="Close"><Icon name="close" /></button></div></div>
    <div id="calendarMonthLabel" className="font-label-lg text-primary font-bold mb-3"></div>
    <div className="calendar-legend"><span><i></i> Published event date</span><span><i className="reg"></i> Local demo entry</span></div>
    <div className="calendar-weekdays"><span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span></div>
    <div id="calendarGrid" className="calendar-grid"></div>
    <div id="calendarEmpty" className="calendar-empty">No published event dates this month. Try another month or browse the event feed.</div>
  </div>
</div>

<div id="passModal" className="pass-modal hidden" data-pass-type="student" aria-hidden={true}>
  <div className="pass-backdrop" data-close-pass></div>
  <div className="pass-dialog" role="dialog" aria-modal="true" aria-labelledby="passTitle">
    <button className="pass-close" type="button" data-close-pass aria-label="Close"><Icon name="close" /></button>
    <p className="category-eyebrow">LOCAL PASS DEMO</p><h2 id="passTitle">Choose a pass preview</h2><p>This form creates a local reference only; it does not submit registration to RCEE or generate a QR code.</p>
    <div className="pass-type-tabs"><button className="pass-type-tab active" data-pass-tab="student" aria-pressed="true" type="button"><strong>Student Pass</strong><small>For college students</small></button><button className="pass-type-tab" data-pass-tab="outer" aria-pressed="false" type="button"><strong>Outer Pass</strong><small>For external participants</small></button></div>
    <form id="studentPassForm" className="pass-form">
      <label>Full name<input name="name" required placeholder="Your full name" /></label><label>College email<input name="email" type="email" required placeholder="name@college.edu" /></label><label>College ID<input name="collegeId" required placeholder="Student ID" /></label><label>Phone<input name="phone" required placeholder="10-digit mobile number" /></label><label className="full">Event<select name="event" id="studentEventSelect"></select></label><button className="pass-submit" type="submit">Generate Student Pass <Icon name="arrow_forward" /></button>
    </form>
    <form id="outerPassForm" className="pass-form hidden">
      <label>Full name<input name="name" required placeholder="Your full name" /></label><label>Email<input name="email" type="email" required placeholder="you@example.com" /></label><label>College / Organization<input name="org" required placeholder="College or organization" /></label><label>Phone<input name="phone" required placeholder="10-digit mobile number" /></label><label className="full">Event<select name="event" id="outerEventSelect"></select></label><button className="pass-submit" type="submit">Generate Outer Pass <Icon name="arrow_forward" /></button>
    </form>
    <div id="passSuccess" className="pass-success hidden"></div>
  </div>
</div>


<section id="digitalPasses" className="digital-passes-section">
  <div className="passes-heading">
    <div><span className="passes-kicker">LOCAL INTERACTION DEMO</span><h2>Preview the event pass flow.</h2><p>This prototype creates a local pass reference and does not register you with RCEE.</p></div>
  </div>
  <div className="pass-grid">
    <article className="pass-card student-pass"><div className="pass-glow"></div><div className="pass-top"><span className="pass-badge">STUDENT DEMO</span><Icon name="school" /></div><h3>For college students</h3><p>Preview the form flow with sample student details. This demo does not confirm event entry.</p><div className="pass-features"><span><Icon name="check_circle" /> Local preview</span><span><Icon name="check_circle" /> Pass reference</span><span><Icon name="check_circle" /> No RCEE submission</span></div><button className="pass-action" type="button" data-open-pass="student">Preview Student Pass <Icon name="arrow_forward" /></button></article>
    <article className="pass-card outer-pass"><div className="pass-glow"></div><div className="pass-top"><span className="pass-badge">GUEST DEMO</span><Icon name="confirmation_number" /></div><h3>For external participants</h3><p>Preview the guest registration form and see the local pass reference flow.</p><div className="pass-features"><span><Icon name="check_circle" /> Guest details</span><span><Icon name="check_circle" /> Pass reference</span><span><Icon name="check_circle" /> Demo only</span></div><button className="pass-action" type="button" data-open-pass="outer">Preview Guest Pass <Icon name="arrow_forward" /></button></article>
  </div>
</section>

<section className="motion-faq-section" id="faq" aria-label="Frequently asked questions">
  <div className="faq-inner">
    <div className="scroll-reveal"><div className="quick-answers-heading">Quick Answers</div><span className="showcase-kicker"><Icon name="help" /> Helpful answers</span><h2>Everything feels simpler when you know where to start.</h2></div>
    <FaqAccordion />
  </div>
  <div className="home-back-top-wrap"><a className="home-back-top" href="#home" aria-label="Back to top"><Icon name="arrow_up" />Back to top</a></div>
</section>
<footer className="w-full bg-surface-container-low border-t border-[#f4d3cb] mt-space-xl shadow-[0_-1px_8px_rgba(38,12,26,0.03)]"><div className="w-full px-gutter-desktop-wide max-w-[1920px] mx-auto py-space-xl"><div className="grid grid-cols-1 md:grid-cols-4 gap-space-lg pb-space-lg"><div className="space-y-space-sm md:col-span-1"><div className="flex items-center gap-space-xs"><span className="collexus-word collexus-word-footer">Collexus</span><span className="font-label-sm text-label-sm px-2 py-0.5 rounded-full bg-blush text-primary font-bold uppercase">Live</span></div><p className="font-body-sm text-body-sm text-on-surface-variant max-w-xs">A friendly campus discovery hub for hackathons, internships, workshops, branch events, and cultural experiences.</p><div className="flex items-center gap-2 pt-space-xs"><Icon name="verified" className="text-secondary text-[18px]" /><span className="font-label-sm text-label-sm text-secondary uppercase tracking-wider font-semibold">Collegiate Verified Network</span></div></div><div className="space-y-space-xs"><div className="font-label-lg text-label-lg text-primary uppercase tracking-wider font-bold">Navigation</div><ul className="space-y-space-xs font-body-sm text-body-sm text-on-surface-variant"><li><a className="hover:text-primary transition-colors" data-path="discover" href="#">Discover Feed</a></li><li><a className="hover:text-primary transition-colors" data-path="explore-events" href="#">Explore Events &amp; Symposia</a></li><li><a className="hover:text-primary transition-colors" data-path="hackathons" href="#">Active Hackathons</a></li><li><a className="hover:text-primary transition-colors" data-path="campus-leaderboard" href="#">University Rankings</a></li></ul></div><div className="space-y-space-xs"><div className="font-label-lg text-label-lg text-primary uppercase tracking-wider font-bold">Ecosystem</div><ul className="space-y-space-xs font-body-sm text-body-sm text-on-surface-variant"><li><a className="hover:text-primary transition-colors" data-path="host-event" href="#">Organizer Console</a></li><li><a className="hover:text-primary transition-colors" data-path="my-passes" href="#">Credential Passports</a></li><li><span className="text-on-surface-variant/70">Collegiate Affiliates</span></li><li><span className="text-on-surface-variant/70">Judging Guidelines</span></li></ul></div><div className="space-y-space-sm md:col-span-1"><div className="font-label-lg text-label-lg text-primary uppercase tracking-wider font-bold">Newsletter Sync</div><p className="font-body-sm text-body-sm text-on-surface-variant">Weekly hack briefs, team recruitment calls, and grant drop updates.</p><div className="flex items-center gap-space-xs"><input className="w-full px-space-sm py-2 rounded-lg bg-surface-container-lowest text-on-surface placeholder:text-on-surface-variant/70 border border-[#f4d3cb] font-body-sm text-body-sm focus:outline-none focus:border-dusty-rose" placeholder="student@university.edu" type="email"/><button className="px-space-md py-2 rounded-lg bg-primary text-on-primary font-label-sm text-label-sm uppercase tracking-wider hover:bg-mocha transition-colors font-bold shadow-sm" type="button">Sync</button></div></div></div><div className="pt-space-md border-t border-[#f4d3cb]/60 flex flex-col md:flex-row items-center justify-between gap-space-sm"><div className="font-body-sm text-body-sm text-on-surface-variant">© 2026 Collexus. All rights reserved.</div><div className="flex flex-wrap items-center justify-center gap-space-md font-body-sm text-body-sm text-secondary"><span className="hover:text-primary cursor-pointer">Privacy Policy</span><span className="hover:text-primary cursor-pointer">Terms of Honor</span><span className="hover:text-primary cursor-pointer">Code of Conduct</span></div></div></div></footer>


    </>
  );
}
