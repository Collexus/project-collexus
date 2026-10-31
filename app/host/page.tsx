"use client";

import Link from "next/link";
import { useState } from "react";
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

const publicBasePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

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
  const [listingName, setListingName] = useState("");

  function requestHref(path: string, plan: "normal" | "pro") {
    const params = new URLSearchParams({ plan, listingName, requestType: requestType ?? "" });
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
  const checkoutPath = requestType === "event" ? "/host-event/" : "/stall-registration/";

  return (
    <main className={styles.page}>
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
            <span className={styles.eyebrow}><Store size={15} aria-hidden="true" /> FOR CAMPUS ORGANIZERS &amp; CREATORS</span>
            <h1>Make your next campus event <em>the one everyone finds.</em></h1>
            <p>Choose the Collexus support that fits your event or stall. Start with the essentials, or add more promotion and dedicated support.</p>
            <div className={styles.heroActions}><Link className={styles.primaryButton} href="/host-event/">For event</Link><Link className={styles.outlineButton} href="/stall-registration/">For stall</Link></div>
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
              <p className={styles.planPrice}>Custom quote <small>based on your event needs</small></p>
              <ul>{normalFeatures.map((feature) => <li key={feature}><Check size={16} aria-hidden="true" />{feature}</li>)}</ul>
              <div className={styles.planActions}><button aria-controls={selectedPlan === "normal" ? "normal-next-step" : undefined} aria-expanded={selectedPlan === "normal"} className={styles.secondaryButton} onClick={() => { setSelectedPlan(selectedPlan === "normal" ? null : "normal"); setRequestType(null); }} type="button">Continue with Normal</button>{selectedPlan === "normal" && <div className={styles.planNext} id="normal-next-step"><button aria-pressed={requestType === "event"} onClick={() => chooseRequestType("event")} type="button">For event</button><button aria-pressed={requestType === "stall"} onClick={() => chooseRequestType("stall")} type="button">For stall</button></div>}</div>
            </article>
            <article className={`${styles.planCard} ${styles.proCard}`}>
              <div className={styles.planHead}><span className={styles.planIcon}><BadgeCheck size={19} aria-hidden="true" /></span><span className={styles.planLabel}>MORE REACH &amp; SUPPORT</span><span className={styles.proBadge}>PRO</span></div>
              <h3>Collexus Pro</h3><p className={styles.planDescription}>A higher-touch package for organizers ready to make a bigger impact.</p>
              <p className={styles.planPrice}>Custom quote <small>based on your event needs</small></p>
              <ul>{proFeatures.map((feature) => <li key={feature}><Check size={16} aria-hidden="true" />{feature}</li>)}</ul>
              <div className={styles.planActions}><button aria-controls={selectedPlan === "pro" ? "pro-next-step" : undefined} aria-expanded={selectedPlan === "pro"} className={styles.primaryButton} onClick={() => { setSelectedPlan(selectedPlan === "pro" ? null : "pro"); setRequestType(null); }} type="button">Continue with Pro</button>{selectedPlan === "pro" && <div className={styles.planNext} id="pro-next-step"><button aria-pressed={requestType === "event"} onClick={() => chooseRequestType("event")} type="button">For event</button><button aria-pressed={requestType === "stall"} onClick={() => chooseRequestType("stall")} type="button">For stall</button></div>}</div>
            </article>
          </div>
          <p className={styles.pricingNote}>Plan pricing and availability are confirmed with the event team after reviewing your request. Request forms create a local file to share; they do not publish an event or reserve a stall.</p>
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
            <div className={styles.orderLine}><span>Collexus {selectedPlan ? selectedPlan === "pro" ? "Pro" : "Normal" : "plan"}</span><strong>Custom quote</strong></div>
            <div className={styles.orderAddOns}><span>Add-ons</span>{selectedAddOns.length ? addOns.filter(({ id }) => selectedAddOns.includes(id)).map((item) => <div className={styles.orderLine} key={item.id}><span>{item.title}</span><strong>{item.price}</strong></div>) : <small>No add-ons selected</small>}</div>
            <div className={styles.orderLine}><span>Subtotal · add-ons</span><strong>₹{addOnSubtotal.toLocaleString("en-IN")}</strong></div>
            <div className={styles.orderTotal}><span>Total payable</span><strong>₹{addOnSubtotal.toLocaleString("en-IN")} <small>+ plan quote</small></strong></div>
            <small className={styles.checkoutNote}>Your plan price is confirmed with the team before payment. This step won’t charge you.</small>
            {selectedPlan && requestType && listingName.trim() ? <Link className={styles.checkoutButton} href={requestHref(checkoutPath, selectedPlan)}>Continue to checkout <ArrowRight size={17} aria-hidden="true" /></Link> : <button className={styles.checkoutButton} disabled type="button">Continue to checkout <ArrowRight size={17} aria-hidden="true" /></button>}
          </div>
        </section>

        <footer className={styles.footer}><Link href="/">Collexus</Link><span>Campus events, in one place.</span><Link href="/help/"><Mail size={14} aria-hidden="true" /> Help &amp; contact</Link><Link href="/#featured-events"><MessageCircle size={14} aria-hidden="true" /> Explore events</Link></footer>
      </div>
    </main>
  );
}
