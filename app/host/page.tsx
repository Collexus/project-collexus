"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  BellRing,
  ChartNoAxesCombined,
  Check,
  Mail,
  Megaphone,
  MessageCircle,
  QrCode,
  Store,
} from "lucide-react";
import styles from "./host.module.css";
import { CollexusHomeLogo } from "@/components/collexus-home-logo";
import { HostStallPayment } from "./host-stall-payment";

const publicBasePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const eventDraftStorageKey = "collexus-host-event-draft-v1";
const stallPrices = { "Silver stall": 1000, "Gold stall": 1500, "Platinum stall": 2000 } as const;
type StallType = keyof typeof stallPrices;
type EventDuration = "under_6_hours" | "8_hours" | "12_hours" | "16_hours" | "20_hours" | "24_hours" | "custom";
type EventPricingDetails = { duration: EventDuration; customDurationHours: number | null; pricing: "free" | "paid"; expectedParticipants: number };

const eventDurationHours: Record<Exclude<EventDuration, "custom">, number> = {
  under_6_hours: 5,
  "8_hours": 8,
  "12_hours": 12,
  "16_hours": 16,
  "20_hours": 20,
  "24_hours": 24,
};

const eventFeeBands = [
  { maxHours: 6, paid: 299, free: 199 },
  { maxHours: 8, paid: 399, free: 299 },
  { maxHours: 12, paid: 599, free: 329 },
  { maxHours: 16, paid: 699, free: 359 },
  { maxHours: 20, paid: 899, free: 399 },
  { maxHours: 24, paid: 999, free: 449 },
] as const;

function readEventPricingDraft(listingName: string): EventPricingDetails | null {
  try {
    const saved = window.localStorage.getItem(eventDraftStorageKey);
    if (!saved) return null;
    const parsed = JSON.parse(saved) as { form?: Record<string, unknown> };
    const form = parsed.form;
    if (!form || (typeof form.eventName === "string" && listingName && form.eventName.trim().toLowerCase() !== listingName.trim().toLowerCase())) return null;
    const duration = form.duration === "under_8_hours" ? "under_6_hours" : form.duration;
    if (typeof duration !== "string" || ![...Object.keys(eventDurationHours), "custom"].includes(duration)) return null;
    if (form.pricing !== "free" && form.pricing !== "paid") return null;
    const expectedParticipants = Number(form.expectedParticipants);
    if (!Number.isInteger(expectedParticipants) || expectedParticipants < 1) return null;
    const customDurationHours = form.customDurationHours === "" || form.customDurationHours == null ? null : Number(form.customDurationHours);
    if (duration === "custom" && (customDurationHours === null || !Number.isFinite(customDurationHours) || customDurationHours < 1)) return null;
    return { duration: duration as EventDuration, customDurationHours, pricing: form.pricing, expectedParticipants };
  } catch {
    return null;
  }
}

function calculateEventFee(details: EventPricingDetails) {
  const hours = details.duration === "custom" ? details.customDurationHours : eventDurationHours[details.duration];
  if (hours === null || hours === undefined || hours <= 0 || hours > 24) return null;
  const band = eventFeeBands.find(({ maxHours }) => hours <= maxHours);
  if (!band) return null;
  let audienceSurcharge = 0;
  if (details.pricing === "paid") {
    const attendees = details.expectedParticipants;
    if (attendees > 6000) return null;
    if (attendees > 4000) audienceSurcharge = 900;
    else if (attendees > 2000) audienceSurcharge = 700;
    else if (attendees > 1000) audienceSurcharge = 500;
    else if (attendees > 500) audienceSurcharge = 400;
    else if (attendees > 250) audienceSurcharge = 200;
    else if (attendees > 120) audienceSurcharge = 100;
  }
  return { hours, baseFee: band[details.pricing], audienceSurcharge };
}

function eventDurationLabel(details: EventPricingDetails) {
  if (details.duration === "custom") return `${details.customDurationHours} hours`;
  if (details.duration === "under_6_hours") return "Less than 6 hours";
  return `${eventDurationHours[details.duration]} hours`;
}

function isStallType(value: string | null): value is StallType {
  return value !== null && Object.hasOwn(stallPrices, value);
}

const normalFeatures = [
  "Host an event or stall on Collexus",
  "Collexus basic promotions",
  "Collexus event or stall support",
];

const proFeatures = [
  "Host an event or stall on Collexus",
  "Exclusive event or stall support",
  "Exclusive event panel",
  "Interactive Collexus promotions",
  "Promotion on official social media handles",
  "Exclusive WhatsApp and email reminders",
  "Homepage highlights and event banners",
];

const addOns = [
  { id: "homepage-panel", title: "Collexus homepage main panel ad", price: "₹999", detail: "Feature your event or stall in the main homepage panel.", Icon: Megaphone },
  { id: "qr-pass", title: "Custom special QR pass", price: "₹549", detail: "Give visitors a branded QR pass for your event or stall.", Icon: QrCode },
  { id: "peak-hour-reminders", title: "Peak-hour customer reminders", price: "₹449", detail: "Send an extra reminder when your event is busiest.", Icon: BellRing },
  { id: "feedback-report", title: "After-event / order feedback report", price: "₹549", detail: "Get a clear summary of customer feedback after the event or order.", Icon: ChartNoAxesCombined },
];

export default function HostWithCollexusPage() {
  const [selectedPlan, setSelectedPlan] = useState<"normal" | "pro" | null>(null);
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
  const [requestType, setRequestType] = useState<"event" | "stall" | null>(null);
  const [stallType, setStallType] = useState<StallType>("Silver stall");
  const [listingName, setListingName] = useState("");
  const [eventPricingDetails, setEventPricingDetails] = useState<EventPricingDetails | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const type = params.get("requestType");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Read browser-only query state after hydration to avoid server/client markup mismatches.
    if (type === "event" || type === "stall") setRequestType(type);
    const requestedStallType = params.get("stallType");
    if (isStallType(requestedStallType)) setStallType(requestedStallType);
    const name = params.get("listingName");
    if (name) setListingName(name);
    // Read saved form details after hydration; browser storage isn't available during render.
    if (type === "event") setEventPricingDetails(readEventPricingDraft(name ?? ""));
  }, []);

  function requestHref(path: string, plan: "normal" | "pro") {
    const params = new URLSearchParams({ plan, listingName, requestType: requestType ?? "" });
    if (requestType === "stall") params.set("stallType", stallType);
    if (selectedAddOns.length) params.set("addons", selectedAddOns.join(","));
    return `${path}?${params.toString()}`;
  }

  function toggleAddOn(id: string) {
    setSelectedAddOns((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  function chooseRequestType(type: "event" | "stall") {
    setRequestType(type);
    document.getElementById("checkout-panel")?.scrollIntoView({ behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "center" });
  }

  const addOnSubtotal = addOns.filter(({ id }) => selectedAddOns.includes(id)).reduce((total, item) => total + Number(item.price.replace(/[^0-9]/g, "")), 0);
  const stallSubtotal = requestType === "stall" ? stallPrices[stallType] : 0;
  const eventFee = requestType === "event" && eventPricingDetails ? calculateEventFee(eventPricingDetails) : null;
  const eventNormalPlanPrice = eventFee ? eventFee.baseFee + eventFee.audienceSurcharge : null;
  const proSurcharge = (requestType === "stall" || requestType === "event") && selectedPlan === "pro" ? 500 : 0;
  const eventOrderSubtotal = eventFee ? eventFee.baseFee + eventFee.audienceSurcharge + proSurcharge + addOnSubtotal : null;
  const stallOrderSubtotal = addOnSubtotal + stallSubtotal + proSurcharge;
  const checkoutPath = requestType === "event" ? "/host-event/" : "/stall-registration/";

  return (
    <main id="main-content" tabIndex={-1} className={styles.page}>
      <header className={styles.header}>
        <Link className={styles.brand} href="/" aria-label="Collexus home"><CollexusHomeLogo basePath={publicBasePath} /></Link>
        <nav className={styles.headerNav} aria-label="Host services navigation">
          <a href="#plans">Plans</a><a href="#add-ons">Add-ons</a>
          <Link className={styles.headerCta} href="/#featured-events">Explore events <ArrowRight size={15} aria-hidden="true" /></Link>
        </nav>
      </header>

      <div className={styles.shell}>
        <section className={styles.hero}>
          <div className={styles.heroCopy}>
            <span className={styles.eyebrow}><Store size={15} aria-hidden="true" /> HOST PAYMENT PAGE · PLANS &amp; ADD-ONS</span>
            <h1>Host Payment Page <em>plans for events &amp; stalls.</em></h1>
            <p>Choose the Collexus plan and add-ons for your event or stall, then review the order before continuing.</p>

            <div className={styles.heroTrust}><span><BadgeCheck size={16} aria-hidden="true" /> Built for campus events</span><span><Store size={16} aria-hidden="true" /> Events and stalls</span></div>
          </div>
          <div className={styles.heroPanel} aria-label="A simple path to promote a campus event">
            <div className={styles.panelTop}><span>YOUR CAMPUS, YOUR MOMENT</span><span className={styles.liveDot} />
            </div>
            <div className={styles.panelIllustration}><img src={`${publicBasePath}/images/stall-registration-illustration.webp`} alt="Students sharing a campus market stall" /><span className={styles.floatingTag}>EVENT · STALL · COMMUNITY</span></div>
            <div className={styles.panelFooter}><strong>Good ideas deserve a crowd.</strong><span>Pick your plan. We’ll help you get seen.</span></div>
          </div>
        </section>

        <section className={styles.plansSection} id="plans" aria-labelledby="plans-title">
          <div className={styles.sectionIntro}><span className={styles.eyebrow}>TWO WAYS TO SHOW UP</span><h2 id="plans-title">Choose your Collexus plan</h2><p>Both plans help people discover your event or stall. Choose the level of promotion and support you need.</p></div>
          <div className={styles.planGrid}>
            <article className={styles.planCard}>
              <div className={styles.planHead}><span className={styles.planIcon}><Check size={19} aria-hidden="true" /></span><span className={styles.planLabel}>THE ESSENTIALS</span></div>
              <h3>Collexus Normal</h3><p className={styles.planDescription}>A clear starting point for campus organizers and stall owners.</p>
              <p className={styles.planPrice}>{requestType === "stall" ? `₹${stallPrices[stallType].toLocaleString("en-IN")}` : requestType === "event" && eventNormalPlanPrice !== null ? `₹${eventNormalPlanPrice.toLocaleString("en-IN")}` : requestType === "event" && eventPricingDetails ? "Custom quote" : "Complete event form"} <small>{requestType === "stall" ? "for your selected stall type with Normal" : requestType === "event" && eventNormalPlanPrice !== null ? "duration and audience fee with Normal" : requestType === "event" && eventPricingDetails ? "this event needs a custom quote" : "to calculate the event fee"}</small></p>
              <ul>{normalFeatures.map((feature) => <li key={feature}><Check size={16} aria-hidden="true" />{feature}</li>)}</ul>
              <div className={styles.planActions}><button aria-controls={selectedPlan === "normal" ? "normal-next-step" : undefined} aria-expanded={selectedPlan === "normal"} className={styles.secondaryButton} onClick={() => setSelectedPlan(selectedPlan === "normal" ? null : "normal")} type="button">Continue with Normal</button>{selectedPlan === "normal" && <div className={styles.planNext} id="normal-next-step"><button aria-pressed={requestType === "event"} onClick={() => chooseRequestType("event")} type="button">For event</button><button aria-pressed={requestType === "stall"} onClick={() => chooseRequestType("stall")} type="button">For stall</button></div>}</div>
            </article>
            <article className={`${styles.planCard} ${styles.proCard}`}>
              <div className={styles.planHead}><span className={styles.planIcon}><BadgeCheck size={19} aria-hidden="true" /></span><span className={styles.planLabel}>MORE REACH &amp; SUPPORT</span><span className={styles.proBadge}>PRO</span></div>
              <h3>Collexus Pro</h3><p className={styles.planDescription}>A higher-touch package for organizers ready to make a bigger impact.</p>
              <p className={styles.planPrice}>{requestType === "stall" ? `₹${(stallPrices[stallType] + 500).toLocaleString("en-IN")}` : requestType === "event" && eventNormalPlanPrice !== null ? `₹${(eventNormalPlanPrice + 500).toLocaleString("en-IN")}` : requestType === "event" && eventPricingDetails ? "Custom quote" : requestType === "event" ? "Complete event form" : "Custom quote"} <small>{requestType === "stall" ? "stall price + ₹500 Pro upgrade" : requestType === "event" && eventNormalPlanPrice !== null ? "event fee + ₹500 Pro upgrade" : requestType === "event" && eventPricingDetails ? "this event needs a custom quote" : requestType === "event" ? "to calculate the event fee" : "based on your event needs"}</small></p>
              <ul>{proFeatures.map((feature) => <li key={feature}><Check size={16} aria-hidden="true" />{feature}</li>)}</ul>
              <div className={styles.planActions}><button aria-controls={selectedPlan === "pro" ? "pro-next-step" : undefined} aria-expanded={selectedPlan === "pro"} className={styles.primaryButton} onClick={() => setSelectedPlan(selectedPlan === "pro" ? null : "pro")} type="button">Continue with Pro</button>{selectedPlan === "pro" && <div className={styles.planNext} id="pro-next-step"><button aria-pressed={requestType === "event"} onClick={() => chooseRequestType("event")} type="button">For event</button><button aria-pressed={requestType === "stall"} onClick={() => chooseRequestType("stall")} type="button">For stall</button></div>}</div>
            </article>
          </div>
          <p className={styles.pricingNote}>Event fees use the selected duration, entry type, and audience size. Paid events above 6,000 attendees and events longer than 24 hours require a custom quote.</p>
        </section>

        <section className={styles.addOnsSection} id="add-ons" aria-labelledby="addons-title">
          <div className={styles.sectionIntro}><span className={styles.eyebrow}>MAKE IT YOURS</span><h2 id="addons-title">Add-ons for a little more reach</h2><p>Give your plan an extra boost with focused promotion and post-event insights.</p></div>
          <div className={styles.addOnGrid}>{addOns.map(({ id, title, price, detail, Icon }) => { const added = selectedAddOns.includes(id); return <article className={styles.addOnCard} key={id}><span className={styles.addOnIcon}><Icon size={20} aria-hidden="true" /></span><div className={styles.addOnTop}><h3>{title}</h3><span className={styles.addOnPrice}>{price}</span></div><p>{detail}</p><span className={styles.addOnFoot}>ONE-TIME ADD-ON</span><button aria-pressed={added} className={added ? styles.addOnAdded : styles.addOnButton} onClick={() => toggleAddOn(id)} type="button">{added ? <><Check size={15} aria-hidden="true" /> Added</> : "Add"}</button></article>; })}</div>
        </section>

        <section className={styles.checkout} id="checkout-panel" aria-labelledby="checkout-title">
          <div className={styles.checkoutForm}>
            <span className={styles.eyebrow}>YOUR ORDER</span><h2 id="checkout-title">Review your plan</h2><p>Tell us what you’re hosting, and we’ll prepare the right next step.</p>
            <label className={styles.checkoutField}><span>Event or stall name</span><input onChange={(event) => setListingName(event.currentTarget.value)} placeholder="e.g. Kreya cultural fest" value={listingName} /></label>
            <div className={styles.checkoutChoice}><span>Collexus plan</span><strong>{selectedPlan ? `Collexus ${selectedPlan === "pro" ? "Pro" : "Normal"}` : "Choose a plan above"}</strong></div>
            <div className={styles.checkoutChoice}><span>Request type</span><strong>{requestType === "event" ? "Event" : requestType === "stall" ? "Stall" : "Choose event or stall above"}</strong></div>
          </div>
          <div className={styles.orderSummary}>
            <h3>Order summary</h3>
            {requestType === "stall" ? <>
              <div className={styles.orderLine}><span>{stallType}</span><strong>₹{stallSubtotal.toLocaleString("en-IN")}</strong></div>
              {selectedPlan === "normal" && <div className={styles.orderLine}><span>Collexus Normal plan</span><strong>Included</strong></div>}
              {selectedPlan === "pro" && <div className={styles.orderLine}><span>Collexus Pro upgrade</span><strong>₹500</strong></div>}
              {!selectedPlan && <div className={styles.orderLine}><span>Collexus plan</span><strong>Choose Normal or Pro</strong></div>}
            </> : requestType === "event" ? <>
              {eventFee && eventPricingDetails ? <>
                <div className={styles.orderLine}><span>{eventPricingDetails.pricing === "paid" ? "Paid event" : "Free event"} · {eventDurationLabel(eventPricingDetails)}</span><strong>₹{eventFee.baseFee.toLocaleString("en-IN")}</strong></div>
                {eventPricingDetails.pricing === "paid" && eventFee.audienceSurcharge > 0 && <div className={styles.orderLine}><span>Paid audience · {eventPricingDetails.expectedParticipants.toLocaleString("en-IN")} people</span><strong>₹{eventFee.audienceSurcharge.toLocaleString("en-IN")}</strong></div>}
              </> : <div className={styles.orderLine}><span>Event hosting fee</span><strong>{eventPricingDetails ? "Custom quote" : "Complete event form"}</strong></div>}
              {selectedPlan === "normal" && <div className={styles.orderLine}><span>Collexus Normal plan</span><strong>Included</strong></div>}
              {selectedPlan === "pro" && <div className={styles.orderLine}><span>Collexus Pro upgrade</span><strong>₹500</strong></div>}
              {!selectedPlan && <div className={styles.orderLine}><span>Collexus plan</span><strong>Choose Normal or Pro</strong></div>}
            </> : <div className={styles.orderLine}><span>Collexus plan</span><strong>Choose event or stall</strong></div>}
            <div className={styles.orderAddOns}><span>Add-ons</span>{selectedAddOns.length ? addOns.filter(({ id }) => selectedAddOns.includes(id)).map((item) => <div className={styles.orderLine} key={item.id}><span>{item.title}</span><strong>{item.price}</strong></div>) : <small>No add-ons selected</small>}</div>
            {requestType === "stall" && <div className={styles.orderLine}><span>Subtotal · stall &amp; add-ons</span><strong>₹{stallOrderSubtotal.toLocaleString("en-IN")}</strong></div>}
            {requestType === "event" && eventFee && <div className={styles.orderLine}><span>Subtotal · event, plan &amp; add-ons</span><strong>₹{eventOrderSubtotal?.toLocaleString("en-IN")}</strong></div>}
            {requestType === "event" && !eventFee && <div className={styles.orderLine}><span>Subtotal</span><strong>Custom quote</strong></div>}
            {requestType === "stall" && <div className={styles.orderTotal}><span>Total payable</span><strong>₹{stallOrderSubtotal.toLocaleString("en-IN")} {!selectedPlan && <small>select a plan</small>}</strong></div>}
            {requestType === "event" && <div className={styles.orderTotal}><span>Total payable</span><strong>{eventOrderSubtotal === null ? "Custom quote" : <>₹{eventOrderSubtotal.toLocaleString("en-IN")} {!selectedPlan && <small>Normal plan shown</small>}</>}</strong></div>}
            {!requestType && <div className={styles.orderTotal}><span>Total payable</span><strong>₹{addOnSubtotal.toLocaleString("en-IN")}</strong></div>}
            <small className={styles.checkoutNote}>{requestType === "stall" ? "The amount shown is calculated on the server. Razorpay verifies the payment before confirming your order." : requestType === "event" ? eventFee ? "Calculated from the saved event details; final terms are confirmed with the Collexus team." : "Event duration or audience exceeds the listed price tiers and needs a custom quote." : "Choose an event or stall to calculate your order."}</small>
            {selectedPlan && requestType === "stall" && listingName.trim() ? <HostStallPayment listingName={listingName.trim()} stallType={stallType} plan={selectedPlan} addOns={selectedAddOns} /> : selectedPlan && requestType === "event" && listingName.trim() ? <Link className={styles.checkoutButton} href={requestHref(checkoutPath, selectedPlan)}>Continue to checkout <ArrowRight size={17} aria-hidden="true" /></Link> : <button className={styles.checkoutButton} disabled type="button">Continue to checkout <ArrowRight size={17} aria-hidden="true" /></button>}
          </div>
        </section>

        <footer className={styles.footer}><Link href="/">Collexus</Link><span>Campus events, in one place.</span><Link href="/help/"><Mail size={14} aria-hidden="true" /> Help &amp; contact</Link><Link href="/#featured-events"><MessageCircle size={14} aria-hidden="true" /> Explore events</Link></footer>
      </div>
    </main>
  );
}
