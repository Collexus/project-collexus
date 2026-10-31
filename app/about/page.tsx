import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpenCheck, CalendarCheck2, Compass, ShieldCheck, Sparkles } from "lucide-react";
import { ContentPage } from "@/components/content-page";
import styles from "@/components/content-page.module.css";
import { events } from "@/data/events";

export const metadata: Metadata = {
  title: "About Collexus",
  description: "Learn how Collexus helps the RCEE community discover campus events and follow official sources.",
};

const datedEvents = events.filter((event) => event.dateStart).length;
const categories = new Set(events.map((event) => event.category)).size;

export default function AboutPage() {
  return (
    <ContentPage
      active="/about/"
      eyebrow="ABOUT COLLEXUS"
      title={<>Your campus.<br />More to discover.</>}
      description="Collexus is a campus discovery hub for Ramachandra College of Engineering event listings—bringing published opportunities together in one clear, source-linked feed."
      illustration={<CampusIllustration />}
    >
      <div className={styles.content}>
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <span className={styles.sectionIcon}><Compass size={20} aria-hidden="true" /></span>
            <div><p className={styles.sectionKicker}>A CLEARER CAMPUS FEED</p><h2>Find what’s happening, then follow the source.</h2><p className={styles.sectionIntro}>Explore workshops, hackathons, project expos and cultural events. Each event detail page points back to its public RCEE source so you can review the original information.</p></div>
          </div>
          <div className={styles.cardGrid}>
            <article className={styles.infoCard}><span className={styles.infoCardIcon}><BookOpenCheck size={18} aria-hidden="true" /></span><h3>Source-linked details</h3><p>Event summaries link to the original college page or report for context and updates.</p></article>
            <article className={styles.infoCard}><span className={styles.infoCardIcon}><CalendarCheck2 size={18} aria-hidden="true" /></span><h3>Dates shown carefully</h3><p>Dates appear when the source publishes them. Listings without exact dates say so.</p></article>
            <article className={styles.infoCard}><span className={styles.infoCardIcon}><Sparkles size={18} aria-hidden="true" /></span><h3>Made for discovery</h3><p>Search and filters help students find events by category, audience and department track.</p></article>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <span className={styles.sectionIcon}><ShieldCheck size={20} aria-hidden="true" /></span>
            <div><p className={styles.sectionKicker}>HOW WE PRESENT INFORMATION</p><h2>Useful context, without guesswork.</h2><p className={styles.sectionIntro}>Collexus is designed to make published information easier to browse. The linked source remains the place to confirm event updates and participation requirements.</p></div>
          </div>
          <ol className={styles.steps}>
            <li className={styles.step}><span className={styles.stepNumber}>01</span><h3>Browse published records</h3><p>Use the event feed to discover campus listings and open a detail page.</p></li>
            <li className={styles.step}><span className={styles.stepNumber}>02</span><h3>Review the source</h3><p>Check the linked RCEE page or report for the latest official event information.</p></li>
            <li className={styles.step}><span className={styles.stepNumber}>03</span><h3>Know what’s a preview</h3><p>Current registration and payment screens demonstrate the flow; they do not reserve a place or take payment.</p></li>
          </ol>
        </section>

        <section className={styles.section}>
          <p className={styles.sectionKicker}>THE CURRENT FEED</p>
          <div className={styles.cardGrid}>
            <article className={styles.infoCard}><h3>{events.length} published event records</h3><p>Summaries are organized into {categories} event categories.</p></article>
            <article className={styles.infoCard}><h3>{datedEvents} records include dates</h3><p>Other listings make clear when the source does not provide an exact date.</p></article>
            <article className={styles.infoCard}><h3>Registration preview</h3><p>Demo activity is never presented as a completed registration or purchase.</p></article>
          </div>
          <div className={styles.emptyActions}><Link className={styles.linkButton} href="/#featured-events">Explore events <ArrowRight size={16} aria-hidden="true" /></Link><Link className={styles.secondaryLink} href="/help/">Visit help <ArrowRight size={15} aria-hidden="true" /></Link></div>
        </section>
      </div>
    </ContentPage>
  );
}

function CampusIllustration() {
  return (
    <svg viewBox="0 0 480 310" role="img" aria-labelledby="campus-art-title campus-art-description">
      <title id="campus-art-title">Students discovering campus events together</title>
      <desc id="campus-art-description">An illustrated campus, people, and event markers in Collexus teal and navy.</desc>
      <defs>
        <linearGradient id="campus-sky" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#bdf8ee" /><stop offset="1" stopColor="#e8f3ff" /></linearGradient>
        <linearGradient id="campus-building" x1="0" y1="0" x2="0" y2="1"><stop stopColor="#fff" /><stop offset="1" stopColor="#d6f0ed" /></linearGradient>
        <linearGradient id="campus-shirt" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#20b9ad" /><stop offset="1" stopColor="#087b86" /></linearGradient>
        <filter id="campus-shadow" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="10" stdDeviation="10" floodColor="#143546" floodOpacity=".13" /></filter>
      </defs>
      <rect x="22" y="20" width="436" height="268" rx="34" fill="url(#campus-sky)" />
      <circle cx="390" cy="72" r="39" fill="#fff" opacity=".58" />
      <circle cx="390" cy="72" r="24" fill="#ffe69a" />
      <path d="M52 222h376v42H52z" fill="#b6e6de" />
      <path d="M45 229c60-19 100-19 154 0 51 18 103 18 155-1 28-10 55-12 83-6v42H45z" fill="#9edbd0" />
      <g filter="url(#campus-shadow)">
        <path d="M126 115 238 61l112 54v105H126z" fill="url(#campus-building)" stroke="#a8d7d7" strokeWidth="2" />
        <path d="m112 119 126-64 126 64H112z" fill="#123744" />
        <path d="M178 131h120v89H178z" fill="#f9ffff" stroke="#bedddd" strokeWidth="2" />
        <path d="M198 145h22v30h-22zm39 0h22v30h-22zm39 0h22v30h-22z" fill="#77d6cc" />
        <path d="M219 185h38v35h-38z" fill="#0c7781" />
        <path d="M236 55v-18h24v30" fill="#123744" />
        <path d="M247 31v22" stroke="#0b7b83" strokeWidth="3" />
        <path d="M184 202h111" stroke="#b4d9d9" strokeWidth="3" />
      </g>
      <g fill="#0d5863"><circle cx="92" cy="197" r="18" /><circle cx="388" cy="196" r="18" /></g>
      <g fill="#20a89f"><circle cx="92" cy="184" r="12" /><circle cx="388" cy="183" r="12" /></g>
      <path d="M83 214h18v40H83zm-9 9h36v31H74zm306-9h18v40h-18zm-9 9h36v31h-36z" fill="#0d6570" />
      <g filter="url(#campus-shadow)">
        <path d="M130 251c0-41 21-63 51-63s51 22 51 63v17H130z" fill="#153a4c" />
        <path d="M148 193c0-20 14-35 33-35s33 15 33 35v14h-66z" fill="#182e3b" />
        <ellipse cx="181" cy="199" rx="27" ry="31" fill="#cf906e" />
        <path d="M155 193c0-24 14-39 36-39 17 0 28 12 30 28-12-8-27-13-44-11-6 9-13 16-22 22z" fill="#242a31" />
        <path d="M220 242h18l31 23h-29l-22-8z" fill="#cf906e" />
        <path d="M170 235h42l21 34h-72z" fill="url(#campus-shirt)" />
        <rect x="196" y="228" width="45" height="35" rx="4" fill="#eef9f7" stroke="#75c8c1" strokeWidth="2" />
        <path d="M205 239h27m-27 7h20" stroke="#159a9a" strokeWidth="3" strokeLinecap="round" />
      </g>
      <g filter="url(#campus-shadow)">
        <path d="M265 254c0-39 20-60 49-60s49 21 49 60v14H265z" fill="#17394a" />
        <path d="M281 199c0-20 14-34 33-34s33 14 33 34v12h-66z" fill="#47362f" />
        <ellipse cx="314" cy="204" rx="26" ry="30" fill="#a96f50" />
        <path d="M287 201c2-26 15-41 37-41 18 0 31 13 33 34-12-7-28-11-47-9-6 6-13 12-23 16z" fill="#302b2b" />
        <path d="M291 236h44l19 33h-80z" fill="#f0a64c" />
        <path d="M275 241h21l-21 25h-25z" fill="#a96f50" />
      </g>
      <g filter="url(#campus-shadow)">
        <rect x="53" y="45" width="70" height="56" rx="18" fill="#fff" />
        <path d="M74 74a14 14 0 1 1 27 0c0 11-13 19-13 19S74 85 74 74z" fill="#0a8c91" />
        <circle cx="87.5" cy="73" r="4.5" fill="#fff" />
        <rect x="346" y="111" width="80" height="57" rx="18" fill="#fff" />
        <path d="M368 142h36m-30-7h23m-23 14h18" stroke="#0b8990" strokeWidth="4" strokeLinecap="round" />
        <circle cx="405" cy="119" r="13" fill="#ffdf8d" />
        <path d="m405 111 2.6 5.2 5.8.8-4.2 4.1 1 5.8-5.2-2.8-5.2 2.8 1-5.8-4.2-4.1 5.8-.8z" fill="#a87000" />
      </g>
      <path d="M117 111c21-21 39-28 65-30m154 115c20-7 35-21 45-42" fill="none" stroke="#0f9c9d" strokeWidth="2" strokeDasharray="4 7" strokeLinecap="round" opacity=".7" />
      <circle cx="118" cy="111" r="4" fill="#f2ae51" /><circle cx="365" cy="154" r="4" fill="#f2ae51" />
    </svg>
  );
}
