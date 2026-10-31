"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, LoaderCircle, LockKeyhole, ReceiptText, TicketCheck } from "lucide-react";
import { ContentPage } from "@/components/content-page";
import styles from "@/components/content-page.module.css";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase-client";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function RegistrationHistory() {
  const [checking, setChecking] = useState(true);
  const [configured, setConfigured] = useState(false);
  const [accountError, setAccountError] = useState(false);

  useEffect(() => {
    let active = true;
    const supabase = getSupabaseClient();
    setConfigured(isSupabaseConfigured());
    if (!supabase) {
      setChecking(false);
      return;
    }

    void supabase.auth.getUser().then(({ data, error }) => {
      if (!active) return;
      if (error || !data.user) {
        window.location.replace(`${basePath}/login/?next=%2Fregistrations%2F`);
        return;
      }
      setChecking(false);
    }).catch(() => {
      if (active) {
        setAccountError(true);
        setChecking(false);
      }
    });

    return () => { active = false; };
  }, []);

  return (
    <ContentPage
      active="/registrations/"
      eyebrow="YOUR COLLEXUS ACCOUNT"
      title={<>Your registrations,<br />all in one place.</>}
      description="Keep track of the events you’ve joined and any related orders. Your history is private to your account."
    >
      <section className={styles.content} aria-live="polite">
        <div className={styles.section}>
          <div className={styles.sectionHead}>
            <span className={styles.sectionIcon}><ReceiptText size={20} aria-hidden="true" /></span>
            <div><p className={styles.sectionKicker}>REGISTRATIONS &amp; ORDERS</p><h2>Your activity</h2><p className={styles.sectionIntro}>Event sign-ups and their order details will appear here when they are available.</p></div>
          </div>
          {checking ? (
            <div className={styles.emptyState} role="status"><LoaderCircle size={23} aria-hidden="true" /><p>Checking your account…</p></div>
          ) : !configured ? (
            <div className={styles.emptyState}>
              <span className={styles.emptyIcon}><LockKeyhole size={23} aria-hidden="true" /></span>
              <h2>Account history is not connected yet</h2>
              <p>Sign-in storage needs to be configured before Collexus can load private account activity.</p>
              <div className={styles.emptyActions}><Link className={styles.linkButton} href="/login/">Go to sign in <ArrowRight size={16} aria-hidden="true" /></Link></div>
            </div>
          ) : accountError ? (
            <div className={styles.emptyState} role="alert">
              <span className={styles.emptyIcon}><LockKeyhole size={23} aria-hidden="true" /></span>
              <h2>We couldn’t check your account</h2>
              <p>Refresh the page or sign in again to view your private activity.</p>
              <div className={styles.emptyActions}><Link className={styles.linkButton} href="/login/?next=%2Fregistrations%2F">Sign in again <ArrowRight size={16} aria-hidden="true" /></Link></div>
            </div>
          ) : (
            <div className={styles.emptyState}>
              <span className={styles.emptyIcon}><TicketCheck size={24} aria-hidden="true" /></span>
              <h2>No registrations or orders yet</h2>
              <p>There’s nothing in your history yet. Collexus’s current event registration and checkout screens are previews; they don’t create a real registration or payment record.</p>
              <div className={styles.emptyActions}><Link className={styles.linkButton} href="/#featured-events">Explore events <ArrowRight size={16} aria-hidden="true" /></Link></div>
            </div>
          )}
          <p className={styles.finePrint}>Only real registrations and orders will appear here. Preview activity is never presented as a completed booking.</p>
        </div>
      </section>
    </ContentPage>
  );
}
