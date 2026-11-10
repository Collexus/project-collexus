import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Database, LockKeyhole, Mail, ShieldCheck, UserRound } from "lucide-react";
import { ContentPage } from "@/components/content-page";
import styles from "./account-privacy.module.css";

export const metadata: Metadata = {
  title: "Account & privacy",
  description: "Manage your Collexus account and learn how account, profile, registration and payment information is handled.",
};

const sections = [
  {
    icon: Database,
    title: "Information Collexus handles",
    paragraphs: [
      "Account details such as your email address, phone number, name, account type and sign-in status, to create and secure your account.",
      "Profile details you choose to provide, which may include your campus ID, institution, address, profile photo, interests, skills, technologies and short biography.",
      "Details you submit for event, stall or food-order workflows, such as attendee or organizer contact details, event preferences, menu orders and request information. Some event and registration pages are previews and do not submit a real registration.",
      "Payment records may include order totals, status and payment-provider references. Razorpay collects and processes card or UPI details in its checkout; Collexus does not ask you to enter or store your card number, CVV, PIN or UPI PIN on this page.",
    ],
  },
  {
    icon: ShieldCheck,
    title: "How it is used",
    paragraphs: [
      "We use account and profile information to provide sign-in, display the profile you choose to maintain, respond to support requests and protect the service.",
      "Information submitted with a request or order is used to process that request, show its status, support event or stall operations, and address disputes or security issues.",
      "Collexus event listings may summarize public RCEE information and link to the original organizer source. Information you enter in a local preview stays in that browser unless the page clearly submits it.",
    ],
  },
  {
    icon: LockKeyhole,
    title: "Storage and service providers",
    paragraphs: [
      "Collexus uses Supabase for account authentication and, where configured, profile and application data. Hosting and security providers may process technical request information to deliver and protect the website.",
      "Cloudflare Turnstile may be used to reduce automated sign-up and sign-in abuse. Razorpay is used for checkout where a live payment flow is enabled; its own privacy terms apply to payment processing.",
      "Some preferences, such as the selected theme or an unfinished form draft, may be saved in your browser. You can clear browser storage through your browser settings, though this can remove unsent drafts or preferences.",
    ],
  },
  {
    icon: UserRound,
    title: "Your account choices",
    paragraphs: [
      "You can review and edit profile details from your account. Keep your sign-in email and recovery contact current so you can access your account.",
      "To request access, correction or deletion of account information, or to ask a privacy question, email hello@collexus.in from the email address associated with your account. We may need to verify your identity before acting on a request.",
      "Some records may need to be retained for security, payment, dispute-resolution or legal purposes. If an account is deleted, a limited record may remain where retention is necessary for those purposes.",
    ],
  },
];

export default function AccountPrivacyPage() {
  return (
    <ContentPage
      active="/account-privacy/"
      eyebrow="YOUR ACCOUNT · YOUR INFORMATION"
      title={<>Account &amp;<br />privacy.</>}
      description="A clear guide to the information connected to your Collexus account, how it is used, and how to contact us about it."
    >
      <div className={styles.content}>
        <section className={styles.notice} aria-label="Privacy notice summary">
          <span><ShieldCheck size={20} aria-hidden="true" /></span>
          <p><strong>Privacy notice</strong><br />Last updated 10 November 2026. We collect information needed to provide the account or feature you use, and we do not store your card security details.</p>
        </section>

        {sections.map(({ icon: Icon, title, paragraphs }) => (
          <section className={styles.section} key={title}>
            <div className={styles.sectionTitle}><span><Icon size={19} aria-hidden="true" /></span><h2>{title}</h2></div>
            <div className={styles.paragraphs}>{paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div>
          </section>
        ))}

        <section className={styles.actions} aria-label="Account links and privacy support">
          <div><h2>Manage your account</h2><p>Update your profile or get help with a privacy request.</p></div>
          <div className={styles.actionLinks}>
            <Link href="/profile/edit/">Edit profile <ArrowRight size={16} aria-hidden="true" /></Link>
            <Link href="/registrations/">Registrations &amp; orders <ArrowRight size={16} aria-hidden="true" /></Link>
            <a href="mailto:hello@collexus.in?subject=Collexus%20privacy%20request"><Mail size={16} aria-hidden="true" /> Contact Collexus <ArrowRight size={16} aria-hidden="true" /></a>
          </div>
        </section>

        <p className={styles.legalNote}>
          We review this notice as Collexus features change. For the official framework, see India’s <a href="https://www.meity.gov.in/digital-personal-data-protection-act" rel="noreferrer" target="_blank">Digital Personal Data Protection Act</a> and <a href="https://www.meity.gov.in/documents/act-and-policies/digital-personal-data-protection-rules-2025-gDOxUjMtQWa" rel="noreferrer" target="_blank">Digital Personal Data Protection Rules, 2025</a>.
        </p>
      </div>
    </ContentPage>
  );
}
