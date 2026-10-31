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
