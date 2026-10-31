import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CalendarDays, CircleHelp, FileText, Search, ShieldCheck, TicketCheck } from "lucide-react";
import { ContentPage } from "@/components/content-page";
import styles from "@/components/content-page.module.css";

export const metadata: Metadata = {
  title: "Help & frequently asked questions",
  description: "Find answers about Collexus event listings, dates, registration previews and your account.",
};

const questions = [
  {
    question: "What can I find on Collexus?",
    answer: <>Collexus brings together published Ramachandra College of Engineering event records, including hackathons, workshops, project expos and cultural events. <Link href="/#featured-events">Browse the event feed</Link> or search by a title, topic or category.</>,
  },
  {
    question: "How do I check an event’s date or other details?",
    answer: <>Open an event to see its published details and source links. Dates are shown when the public RCEE source provides them; otherwise the listing says that a date was not listed.</>,
  },
  {
    question: "Does the registration or checkout preview reserve my place?",
    answer: <>No. The current registration and payment screens are a demonstration only. They do not send your information to RCEE, contact a payment provider, create a registration, or charge you.</>,
  },
  {
    question: "Where can I find my registrations or orders?",
    answer: <>Your private account page is at <Link href="/registrations/">Registrations &amp; orders</Link>. It currently shows an empty state because the event preview does not create real records.</>,
  },
  {
    question: "How do I update my profile?",
    answer: <>Visit <Link href="/profile/edit/">Edit profile</Link> to update your contact details, campus ID, interests and skills. Profile details are tied to your account when sign-in storage is configured.</>,
  },
  {
    question: "Who should I contact about an event?",
    answer: <>Use the official RCEE page or report linked from that event’s detail page. Collexus summarizes public listings and does not manage event participation.</>,
  },
];

export default function HelpPage() {
  return (
    <ContentPage
      active="/help/"
      eyebrow="HELP CENTRE"
      title={<>A little help<br />goes a long way.</>}
      description="Quick answers about finding campus events, checking source details, and using your Collexus account."
    >
      <div className={styles.content}>
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <span className={styles.sectionIcon}><CircleHelp size={20} aria-hidden="true" /></span>
            <div><p className={styles.sectionKicker}>QUICK ANSWERS</p><h2>Frequently asked questions</h2><p className={styles.sectionIntro}>Choose a question to see the answer.</p></div>
          </div>
          <div className={styles.faqList}>
            {questions.map(({ question, answer }) => <details className={styles.faqItem} key={question}><summary>{question}</summary><p className={styles.faqAnswer}>{answer}</p></details>)}
          </div>
        </section>
        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <span className={styles.sectionIcon}><Search size={20} aria-hidden="true" /></span>
            <div><p className={styles.sectionKicker}>NEED A NEXT STEP?</p><h2>Find the right place</h2></div>
          </div>
          <div className={styles.cardGrid}>
            <article className={styles.infoCard}><span className={styles.infoCardIcon}><CalendarDays size={18} aria-hidden="true" /></span><h3>Explore the event feed</h3><p>Search listings and open an event for its details and official source links.</p><Link className={styles.secondaryLink} href="/#featured-events">Browse events <ArrowRight size={15} aria-hidden="true" /></Link></article>
            <article className={styles.infoCard}><span className={styles.infoCardIcon}><TicketCheck size={18} aria-hidden="true" /></span><h3>Check account activity</h3><p>See the current state of your registrations and order history.</p><Link className={styles.secondaryLink} href="/registrations/">Open history <ArrowRight size={15} aria-hidden="true" /></Link></article>
            <article className={styles.infoCard}><span className={styles.infoCardIcon}><ShieldCheck size={18} aria-hidden="true" /></span><h3>Learn about Collexus</h3><p>See how event information is collected and presented.</p><Link className={styles.secondaryLink} href="/about/">About Collexus <ArrowRight size={15} aria-hidden="true" /></Link></article>
          </div>
          <p className={styles.finePrint}><FileText size={14} aria-hidden="true" /> Event dates and facts follow each linked public source.</p>
        </section>
      </div>
    </ContentPage>
  );
}
