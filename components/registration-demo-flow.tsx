"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, BadgeCheck, CreditCard, LockKeyhole, TicketCheck } from "lucide-react";

type EventSummary = {
  slug: string;
  title: string;
  dateLabel: string;
  audience: string;
  fee: string;
};

type Registration = { slug: string; name: string; email: string };

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

  function submit(eventForm: FormEvent<HTMLFormElement>) {
    eventForm.preventDefault();
    const values = new FormData(eventForm.currentTarget);
    const registration: Registration = {
      slug: event.slug,
      name: String(values.get("name") ?? "").trim(),
      email: String(values.get("email") ?? "").trim(),
    };
    if (!registration.name || !registration.email) {
      setError("Enter your name and email to continue.");
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
      <h1>Register for this event</h1>
      <p className="demo-event-title">{event.title}</p>
      <div className="demo-event-meta"><span>{event.dateLabel}</span><span>{event.audience}</span></div>
      <p className="demo-archive-notice">This is a historical event record. Continue only to preview the registration and checkout screens; it will not reserve a place.</p>
      <form className="demo-form" onSubmit={submit}>
        <label htmlFor="demo-name">Full name</label>
        <input id="demo-name" name="name" autoComplete="name" required maxLength={90} placeholder="Your name" />
        <label htmlFor="demo-email">Email address</label>
        <input id="demo-email" name="email" type="email" autoComplete="email" required maxLength={160} placeholder="you@example.com" />
        {error && <p className="demo-form-error" role="alert">{error}</p>}
        <button className="primary-button demo-submit" type="submit">Continue to payment preview <ArrowRight size={16} aria-hidden="true" /></button>
      </form>
      <p className="demo-fee-line"><strong>Published entry information</strong><span>{event.fee}</span></p>
    </DemoFrame>
  );
}

export function DemoPaymentPanel({ event }: { event: EventSummary }) {
  const router = useRouter();
  const [registration, setRegistration] = useState<Registration | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(registrationKey(event.slug));
      const parsed = raw ? JSON.parse(raw) as Registration : null;
      if (parsed?.slug === event.slug && parsed.name && parsed.email) setRegistration(parsed);
    } catch {
      setRegistration(null);
    }
    setReady(true);
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
    try {
      const raw = sessionStorage.getItem(registrationKey(event.slug));
      const parsed = raw ? JSON.parse(raw) as Registration : null;
      const complete = sessionStorage.getItem(`${registrationKey(event.slug)}:complete`) === "true";
      if (complete && parsed?.slug === event.slug) setRegistration(parsed);
    } catch {
      setRegistration(null);
    }
    setReady(true);
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
