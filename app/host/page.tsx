import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  BellRing,
  CalendarDays,
  ChartNoAxesCombined,
  Check,
  ClipboardList,
  Mail,
  Megaphone,
  MessageCircle,
  QrCode,
  Store,
  UsersRound,
} from "lucide-react";
import styles from "./host.module.css";
import { CollexusHomeLogo } from "@/components/collexus-home-logo";

const publicBasePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export const metadata: Metadata = {
  title: "Host with Collexus | Plans & Add-ons",
  description: "Choose Collexus Normal or Pro support for your campus event or stall, and explore promotional add-ons.",
};

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
  { title: "Collexus homepage main panel ad", price: "₹999", detail: "Feature your event or stall in the main homepage panel.", Icon: Megaphone },
  { title: "Custom special QR pass", price: "₹549", detail: "Give visitors a branded QR pass for your event or stall.", Icon: QrCode },
  { title: "Peak-hour customer reminders", price: "₹449", detail: "Send an extra reminder when your event is busiest.", Icon: BellRing },
  { title: "After-event / order feedback report", price: "₹549", detail: "Get a clear summary of customer feedback after the event or order.", Icon: ChartNoAxesCombined },
];

export default function HostWithCollexusPage() {
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
            <div className={styles.heroActions}><a className={styles.primaryButton} href="#plans">Compare plans <ArrowRight size={17} aria-hidden="true" /></a><Link className={styles.textLink} href="/#featured-events">See what’s on Collexus</Link></div>
            <div className={styles.heroTrust}><span><BadgeCheck size={16} aria-hidden="true" /> Built for campus events</span><span><UsersRound size={16} aria-hidden="true" /> Events and stalls</span></div>
          </div>
          <div className={styles.heroPanel} aria-label="A simple path to promote a campus event">
            <div className={styles.panelTop}><span>YOUR CAMPUS, YOUR MOMENT</span><span className={styles.liveDot} />
            </div>
            <div className={styles.panelIllustration}><div className={styles.orb} /><div className={styles.panelIcon}><CalendarDays size={27} aria-hidden="true" /></div><div className={styles.panelIconAlt}><Store size={23} aria-hidden="true" /></div><div className={styles.panelLine} /><span className={styles.floatingTag}>EVENT · STALL · COMMUNITY</span></div>
            <div className={styles.panelFooter}><strong>Good ideas deserve a crowd.</strong><span>Pick your plan. We’ll help you get seen.</span></div>
          </div>
        </section>

        <section className={styles.plansSection} id="plans" aria-labelledby="plans-title">
          <div className={styles.sectionIntro}><span className={styles.eyebrow}>TWO WAYS TO SHOW UP</span><h2 id="plans-title">Choose your Collexus plan</h2><p>Both plans help people discover your event or stall. Choose the level of promotion and support you need.</p></div>
          <div className={styles.planGrid}>
            <article className={styles.planCard}>
              <div className={styles.planHead}><span className={styles.planIcon}><ClipboardList size={19} aria-hidden="true" /></span><span className={styles.planLabel}>THE ESSENTIALS</span></div>
              <h3>Collexus Normal</h3><p className={styles.planDescription}>A clear starting point for campus organizers and stall owners.</p>
              <p className={styles.planPrice}>Custom quote <small>based on your event needs</small></p>
              <ul>{normalFeatures.map((feature) => <li key={feature}><Check size={16} aria-hidden="true" />{feature}</li>)}</ul>
              <div className={styles.planActions}><Link className={styles.secondaryButton} href="/host-event/">Host an event <ArrowRight size={16} aria-hidden="true" /></Link><Link className={styles.secondaryButton} href="/stall-registration/">Register a stall <ArrowRight size={16} aria-hidden="true" /></Link></div>
            </article>
            <article className={`${styles.planCard} ${styles.proCard}`}>
              <div className={styles.planHead}><span className={styles.planIcon}><BadgeCheck size={19} aria-hidden="true" /></span><span className={styles.planLabel}>MORE REACH &amp; SUPPORT</span><span className={styles.proBadge}>PRO</span></div>
              <h3>Collexus Pro</h3><p className={styles.planDescription}>A higher-touch package for organizers ready to make a bigger impact.</p>
              <p className={styles.planPrice}>Custom quote <small>based on your event needs</small></p>
              <ul>{proFeatures.map((feature) => <li key={feature}><Check size={16} aria-hidden="true" />{feature}</li>)}</ul>
              <div className={styles.planActions}><Link className={styles.primaryButton} href="/host-event/">Plan an event <ArrowRight size={16} aria-hidden="true" /></Link><Link className={styles.primaryButton} href="/stall-registration/">Plan a stall <ArrowRight size={16} aria-hidden="true" /></Link></div>
            </article>
          </div>
          <p className={styles.pricingNote}>Plan pricing and availability are confirmed with the event team after reviewing your request. Request forms create a local file to share; they do not publish an event or reserve a stall.</p>
        </section>

        <section className={styles.addOnsSection} id="add-ons" aria-labelledby="addons-title">
          <div className={styles.sectionIntro}><span className={styles.eyebrow}>MAKE IT YOURS</span><h2 id="addons-title">Add-ons for a little more reach</h2><p>Give your plan an extra boost with focused promotion and post-event insights.</p></div>
          <div className={styles.addOnGrid}>{addOns.map(({ title, price, detail, Icon }) => <article className={styles.addOnCard} key={title}><span className={styles.addOnIcon}><Icon size={20} aria-hidden="true" /></span><div className={styles.addOnTop}><h3>{title}</h3><span className={styles.addOnPrice}>{price}</span></div><p>{detail}</p><span className={styles.addOnFoot}>ONE-TIME ADD-ON</span></article>)}</div>
        </section>

        <section className={styles.howSection} aria-labelledby="how-title">
          <div className={styles.sectionIntro}><span className={styles.eyebrow}>A SIMPLE START</span><h2 id="how-title">From idea to event day</h2></div>
          <div className={styles.steps}><article><span>01</span><h3>Choose your route</h3><p>Start an event request or a stall request with the details you have.</p></article><article><span>02</span><h3>Pick your support</h3><p>Tell the team which plan and add-ons match your goals.</p></article><article><span>03</span><h3>Get ready to be seen</h3><p>Confirm the package, promotional timing and event details with the team.</p></article></div>
        </section>

        <section className={styles.bottomCta}><div><span className={styles.eyebrow}>READY WHEN YOU ARE</span><h2>Let’s get your campus talking.</h2><p>Choose an event or stall request to get started.</p></div><div className={styles.bottomActions}><Link className={styles.primaryButton} href="/host-event/"><CalendarDays size={17} aria-hidden="true" /> Host an event <ArrowRight size={16} aria-hidden="true" /></Link><Link className={styles.secondaryButton} href="/stall-registration/"><Store size={17} aria-hidden="true" /> Register a stall <ArrowRight size={16} aria-hidden="true" /></Link></div></section>

        <footer className={styles.footer}><Link href="/">Collexus</Link><span>Campus events, in one place.</span><Link href="/help/"><Mail size={14} aria-hidden="true" /> Help &amp; contact</Link><Link href="/#featured-events"><MessageCircle size={14} aria-hidden="true" /> Explore events</Link></footer>
      </div>
    </main>
  );
}
