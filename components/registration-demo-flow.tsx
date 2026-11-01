"use client";

import { useEffect, useState, type ChangeEvent, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, BadgeCheck, CreditCard, LockKeyhole, TicketCheck } from "lucide-react";

type EventSummary = {
  slug: string;
  title: string;
  dateLabel: string;
  category?: string;
  dateStart?: string | null;
  dateEnd?: string | null;
  registrationClosed?: boolean;
  audience: string;
  fee: string;
};

type Registration = { slug: string; name: string; email: string; collegeId: string; phone: string; passType: string; friendCount: number; friendNames: string };

const registrationKey = (slug: string) => `collexus-demo-registration:${slug}`;

function DemoFrame({ event, step, children }: { event: EventSummary; step: string; children: ReactNode }) {
  return (
    <main className="details-page demo-page">
      <div className="details-topline">
        <Link href={`/events/${event.slug}`} className="back-link"><ArrowLeft size={15} aria-hidden="true" /> Event details</Link>
        <span className="record-label"><span className="demo-status-dot" /> NO-CHARGE DEMO</span>
      </div>
      <section className="demo-card">
        <div className="demo-progress" aria-label={`Step ${step} of 2`}>
          <span className={step === "1" ? "active" : "complete"}>1 <small>Registration</small></span>
          <i />
          <span className={step === "2" ? "active" : "complete"}>2 <small>Payment preview</small></span>
        </div>
        {children}
      </section>
      <p className="demo-privacy-note"><LockKeyhole size={14} aria-hidden="true" /> Demo only. Details stay in this browser session; nothing is sent to RCEE or a payment provider.</p>
    </main>
  );
}

export function RegistrationDemoForm({ event }: { event: EventSummary }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const isFest = event.category === "Cultural" || event.category === "Special event";
  const [photoUrl, setPhotoUrl] = useState("");
  useEffect(() => () => { if (photoUrl) URL.revokeObjectURL(photoUrl); }, [photoUrl]);

  function previewPhoto(change: ChangeEvent<HTMLInputElement>) {
    const file = change.currentTarget.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      change.currentTarget.value = "";
      setError("Choose a profile image smaller than 5 MB.");
      return;
    }
    setError("");
    setPhotoUrl(URL.createObjectURL(file));
  }

  function submit(eventForm: FormEvent<HTMLFormElement>) {
    eventForm.preventDefault();
    const values = new FormData(eventForm.currentTarget);
    const registration: Registration = {
      slug: event.slug,
      name: String(values.get("name") ?? "").trim(),
      email: String(values.get("email") ?? "").trim(),
      collegeId: String(values.get("collegeId") ?? "").trim(),
      phone: String(values.get("phone") ?? "").trim(),
      passType: String(values.get("passType") ?? "student"),
      friendCount: isFest ? Number(values.get("friendCount") ?? 0) : 0,
      friendNames: isFest ? String(values.get("friendNames") ?? "").trim() : "",
    };
    if (!registration.name || !registration.email || !registration.collegeId || !registration.phone || (isFest && registration.friendCount > 0 && !registration.friendNames)) {
      setError("Complete the required details to continue.");
      return;
    }
    try {
      sessionStorage.setItem(registrationKey(event.slug), JSON.stringify(registration));
    } catch {
      setError("This browser session cannot save demo details. Allow session storage and try again.");
      return;
    }
    router.push(`/demo-payment/${event.slug}`);
  }

  return (
    <DemoFrame event={event} step="1">
      <span className="demo-kicker"><TicketCheck size={15} aria-hidden="true" /> EVENT REGISTRATION</span>
      <h1>{event.registrationClosed ? "Registration preview" : "Register for this event"}</h1>
      <p className="demo-event-title">{event.title}</p>
      <div className="demo-event-meta"><span>{event.dateLabel}</span><span>{event.audience}</span></div>
      <p className="demo-archive-notice">{event.registrationClosed ? "Registration for this historical event is closed. You can preview the form and fee layout, but this will not create an entry, reserve a place, or take payment." : "Preview only. This form does not send an entry to the organizer or reserve a place."}</p>
      <form className="demo-form" onSubmit={submit}>
        <div className="demo-profile-row"><div className="demo-avatar">{photoUrl ? <Image src={photoUrl} alt="Selected profile preview" width={50} height={50} unoptimized /> : <span aria-hidden="true">YOU</span>}</div><div className="demo-profile-copy"><strong>Profile photo</strong><small>Optional · JPG, PNG or WebP · up to 5 MB</small></div><label className="demo-photo-button" htmlFor="demo-photo">Add image</label><input className="demo-photo-input" id="demo-photo" name="photo" type="file" accept="image/png,image/jpeg,image/webp" onChange={previewPhoto} /></div>
        <div className="demo-registration-grid">
          <label htmlFor="demo-name">Full name</label><input id="demo-name" name="name" autoComplete="name" required maxLength={90} placeholder="Your name" />
          <label htmlFor="demo-email">Email address</label><input id="demo-email" name="email" type="email" autoComplete="email" required maxLength={160} placeholder="you@example.com" />
          <label htmlFor="demo-college-id">College ID</label><input id="demo-college-id" name="collegeId" required maxLength={40} placeholder="Your student ID" />
          <label htmlFor="demo-phone">Phone number</label><input id="demo-phone" name="phone" type="tel" autoComplete="tel" required maxLength={20} placeholder="Your mobile number" />
          {isFest ? <><label htmlFor="demo-pass-type">Pass type</label><select id="demo-pass-type" name="passType"><option value="student">Student pass</option><option value="outer">Guest pass</option></select><label htmlFor="demo-friend-count">Extra fest passes</label><select id="demo-friend-count" name="friendCount"><option value="0">Just me</option><option value="1">1 friend</option><option value="2">2 friends</option><option value="3">3 friends</option><option value="4">4 friends</option><option value="5">5 friends</option></select><label className="demo-friends-label" htmlFor="demo-friend-names">Friends’ names <small>(if adding passes)</small></label><textarea className="demo-friends-field" id="demo-friend-names" name="friendNames" rows={2} maxLength={500} placeholder="Add one name per line" /></> : null}
        </div>
        <p className="demo-pass-rule">{isFest ? "For fests and cultural events, you may request passes for your friends and outside guests, subject to the event’s rules and organizer approval." : "For technical and academic events, passes are for you only."}</p>
        <section className="demo-fee-card" aria-labelledby="demo-fee-heading"><div className="demo-fee-heading"><div><span className="demo-kicker">PAYMENT DETAILS</span><h2 id="demo-fee-heading">Fee breakdown</h2></div><span className={event.registrationClosed ? "demo-fee-status closed" : "demo-fee-status"}>{event.registrationClosed ? "Registration closed" : "Fee not confirmed"}</span></div><p className="demo-published-fee">{event.fee}</p><dl><div><dt>Event registration fee</dt><dd>—</dd></div><div><dt>Platform fee <span>(0.5%)</span></dt><dd>—</dd></div><div><dt>Payment gateway and GST <span>(2% fee + 18% GST)</span></dt><dd>—</dd></div><div className="demo-fee-total"><dt>Total payable</dt><dd>—</dd></div></dl><p className="demo-fee-disclaimer">A confirmed single fee is not available in the official listing, so the charges cannot be calculated. No payment is taken in this preview.</p></section>
        <p className="demo-registration-note">For technical and academic events, passes are for you only. For fests and cultural events, you may request passes for your friends and outside guests, according to the event’s rules. Details stay in this browser session and are cleared when it ends; the profile image is previewed locally and never uploaded.</p>
        {error && <p className="demo-form-error" role="alert">{error}</p>}
        <button className="primary-button demo-submit" type="submit">Continue to registration preview <ArrowRight size={16} aria-hidden="true" /></button>
      </form>
    </DemoFrame>
  );
}

export function DemoPaymentPanel({ event }: { event: EventSummary }) {
  const router = useRouter();
  const [registration, setRegistration] = useState<Registration | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      let nextRegistration: Registration | null = null;
      try {
        const raw = sessionStorage.getItem(registrationKey(event.slug));
        const parsed = raw ? JSON.parse(raw) as Registration : null;
        if (parsed?.slug === event.slug && parsed.name && parsed.email) nextRegistration = parsed;
      } catch { nextRegistration = null; }
      setRegistration(nextRegistration);
      setReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [event.slug]);

  function simulatePayment() {
    if (!registration) return;
    try {
      sessionStorage.setItem(`${registrationKey(event.slug)}:complete`, "true");
      router.push(`/demo-payment/${event.slug}/success`);
    } catch {
      router.push(`/demo-payment/${event.slug}/success`);
    }
  }

  return (
    <DemoFrame event={event} step="2">
      <span className="demo-kicker"><CreditCard size={15} aria-hidden="true" /> PAYMENT PREVIEW</span>
      <h1>Secure checkout</h1>
      <p className="demo-event-title">{event.title}</p>
      {!ready ? <p className="demo-loading" role="status">Preparing your demo checkout…</p> : registration ? (
        <>
          <div className="demo-order-summary">
            <div><span>Registrant</span><strong>{registration.name}</strong></div>
            <div><span>Email</span><strong>{registration.email}</strong></div>
            <div><span>Published entry fee</span><strong>{event.fee}</strong></div>
          </div>
          <div className="demo-gateway-mark"><span className="gateway-symbol"><CreditCard size={20} aria-hidden="true" /></span><span><strong>Razorpay checkout preview</strong><small>Sandbox-style screen · no transaction</small></span><BadgeCheck size={19} aria-hidden="true" /></div>
          <p className="demo-archive-notice">This historical event is closed. The button below only demonstrates the checkout handoff. It will not contact Razorpay, collect payment, or create a registration.</p>
          <button className="primary-button demo-submit" type="button" onClick={simulatePayment}>Simulate successful payment <ArrowRight size={16} aria-hidden="true" /></button>
        </>
      ) : (
        <div className="demo-no-session"><p>No registration details were found in this browser session.</p><Link className="primary-button" href={`/events/${event.slug}/register`}>Start registration preview <ArrowRight size={16} aria-hidden="true" /></Link></div>
      )}
      <Link className="demo-back-link" href={`/events/${event.slug}/register`}><ArrowLeft size={14} aria-hidden="true" /> Back to registration</Link>
    </DemoFrame>
  );
}

export function DemoPaymentSuccess({ event }: { event: EventSummary }) {
  const [registration, setRegistration] = useState<Registration | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      let nextRegistration: Registration | null = null;
      try {
        const raw = sessionStorage.getItem(registrationKey(event.slug));
        const parsed = raw ? JSON.parse(raw) as Registration : null;
        const complete = sessionStorage.getItem(`${registrationKey(event.slug)}:complete`) === "true";
        if (complete && parsed?.slug === event.slug) nextRegistration = parsed;
      } catch { nextRegistration = null; }
      setRegistration(nextRegistration);
      setReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [event.slug]);

  return (
    <main className="details-page demo-page">
      <section className="demo-card demo-success-card">
        {!ready ? <p className="demo-loading" role="status">Checking demo result…</p> : registration ? (
          <>
            <span className="demo-success-icon"><BadgeCheck size={28} aria-hidden="true" /></span>
            <span className="demo-kicker">DEMO CHECKOUT COMPLETE</span>
            <h1>Payment preview finished</h1>
            <p className="demo-success-copy">Thanks, {registration.name}. This was a no-charge simulation for <strong>{event.title}</strong>. You are not registered and no payment was made.</p>
            <div className="demo-reference"><span>Demo reference</span><strong>DEMO-{event.slug.slice(0, 6).toUpperCase()}-01</strong></div>
          </>
        ) : (
          <>
            <span className="demo-kicker">NO DEMO PAYMENT FOUND</span>
            <h1>Checkout was not completed</h1>
            <p className="demo-success-copy">Start from the registration preview to see the full demo flow.</p>
          </>
        )}
        <div className="demo-success-actions"><Link className="primary-button" href={`/events/${event.slug}`}>Back to event <ArrowRight size={16} aria-hidden="true" /></Link><Link className="secondary-button" href="/#featured-events">Browse events</Link></div>
      </section>
    </main>
  );
}
