"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, CircleAlert, LockKeyhole } from "lucide-react";
import { getSupabaseClient } from "@/lib/supabase-client";

type Ticket = { id: string; eventTitle: string; name: string; description: string | null; pricePaise: number };
type RazorpayFailure = { error?: { description?: string; reason?: string } };
type RazorpayCheckout = { open: () => void; on: (event: "payment.failed", handler: (response: RazorpayFailure) => void) => void };
type RazorpayOptions = {
  key: string; order_id: string; amount: number; currency: string; name: string; description: string;
  handler: (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => void;
  modal: { ondismiss: () => void };
  theme: { color: string };
};
declare global { interface Window { Razorpay?: new (options: RazorpayOptions) => RazorpayCheckout } }

async function loadRazorpay() {
  if (window.Razorpay) return;
  await new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Razorpay checkout could not load. Try again."));
    document.body.appendChild(script);
  });
}

const money = (paise: number) => `₹${(paise / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function EventRegistrationCheckout({ event }: { event: { slug: string; title: string } }) {
  const router = useRouter();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [ticketId, setTicketId] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const checkoutKey = useRef<string | null>(null);

  useEffect(() => {
    let active = true;
    void fetch(`/api/events/${encodeURIComponent(event.slug)}/tickets`, { cache: "no-store" })
      .then(async (response) => {
        const payload = await response.json() as { tickets?: Ticket[]; error?: string };
        if (!response.ok) throw new Error(payload.error || "Ticket availability could not be checked.");
        if (active) { setTickets(payload.tickets ?? []); setTicketId(payload.tickets?.[0]?.id ?? ""); }
      })
      .catch((error: unknown) => setNotice(error instanceof Error ? error.message : "Tickets are unavailable right now."))
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [event.slug]);

  async function checkout() {
    setNotice("");
    if (!ticketId || name.trim().length < 2 || !email.includes("@") || phone.trim().length < 7) {
      setNotice("Choose a ticket and enter your name, email, and phone number.");
      return;
    }
    const supabase = getSupabaseClient();
    if (!supabase) { setNotice("Sign-in and payment are not configured on this site."); return; }
    setBusy(true);
    try {
      const idempotencyKey = checkoutKey.current ?? crypto.randomUUID();
      checkoutKey.current = idempotencyKey;
      const response = await fetch("/api/payments/checkout", {
        method: "POST", headers: { "Content-Type": "application/json", "Idempotency-Key": idempotencyKey },
        body: JSON.stringify({ kind: "event_registration", ticketTypeId: ticketId, attendeeName: name.trim(), attendeeEmail: email.trim(), attendeePhone: phone.trim() }),
      });
      const purchase = await response.json() as { paymentId?: string; error?: string };
      if (!response.ok || !purchase.paymentId) throw new Error(purchase.error || "This ticket is no longer available.");
      const { data: orderData, error: orderError } = await supabase.functions.invoke("razorpay-payments", { body: { action: "create_order", payment_id: purchase.paymentId } });
      if (orderError || !orderData?.order_id || !orderData?.key_id) throw new Error(orderData?.error || orderError?.message || "Could not start payment.");
      await loadRazorpay();
      const checkout = new window.Razorpay!({
        key: orderData.key_id, order_id: orderData.order_id, amount: orderData.amount, currency: orderData.currency,
        name: "Collexus", description: `${event.title} · event registration`, theme: { color: "#087e83" },
        modal: { ondismiss: () => setBusy(false) },
        handler: (details) => {
          void supabase.functions.invoke("razorpay-payments", { body: { action: "verify_payment", payment_id: purchase.paymentId, ...details } })
            .then(({ data, error }) => {
              if (error || data?.status !== "paid") throw new Error(data?.error || error?.message || "Payment confirmation is pending. Check your registrations shortly.");
              checkoutKey.current = null;
              router.push("/registrations/?payment=success");
            }).catch((error: unknown) => setNotice(error instanceof Error ? error.message : "Payment confirmation is pending."))
            .finally(() => setBusy(false));
        },
      });
      checkout.on("payment.failed", ({ error }) => {
        setNotice(error?.description || "Payment failed. Try another payment method or retry.");
        setBusy(false);
      });
      checkout.open();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not start checkout. Please try again.");
      setBusy(false);
    }
  }

  return <main id="main-content" tabIndex={-1} className="details-page demo-page">
    <div className="details-topline"><Link href={`/events/${event.slug}`} className="back-link site-back-link"><ArrowLeft size={15} aria-hidden="true" /> Event details</Link><span className="record-label"><LockKeyhole size={13} /> SECURE CHECKOUT</span></div>
    <section className="demo-card">
      <p className="category-eyebrow">EVENT REGISTRATION</p><h1>{event.title}</h1>
      {loading ? <p aria-live="polite">Checking available tickets…</p> : tickets.length === 0 ? <div role="status"><p>There are no paid tickets open for this event right now.</p><p>Checkout appears after the event team publishes a price and opens ticket sales.</p><Link className="back-link site-back-link" href={`/events/${event.slug}`}><ArrowLeft size={15} aria-hidden="true" /> Return to event details</Link></div> : <>
        <div className="demo-registration-grid"><label>Ticket type<select value={ticketId} onChange={(change) => { checkoutKey.current = null; setTicketId(change.target.value); }}>{tickets.map((ticket) => <option value={ticket.id} key={ticket.id}>{ticket.name} · {money(ticket.pricePaise)}</option>)}</select></label></div>
        {tickets.find((ticket) => ticket.id === ticketId)?.description && <p className="demo-registration-note">{tickets.find((ticket) => ticket.id === ticketId)?.description}</p>}
        <div className="demo-registration-grid">
          <label>Full name<input autoComplete="name" maxLength={160} value={name} onChange={(change) => { checkoutKey.current = null; setName(change.target.value); }} /></label>
          <label>Email<input autoComplete="email" type="email" maxLength={320} value={email} onChange={(change) => { checkoutKey.current = null; setEmail(change.target.value); }} /></label>
          <label>Phone<input autoComplete="tel" type="tel" maxLength={40} value={phone} onChange={(change) => { checkoutKey.current = null; setPhone(change.target.value); }} /></label>
        </div>
        {notice && <p className="demo-form-error" role="alert"><CircleAlert size={14} /> {notice}</p>}
        <button className="demo-submit" disabled={busy} type="button" onClick={() => void checkout()}>{busy ? "Preparing secure checkout…" : `Pay ${money(tickets.find((ticket) => ticket.id === ticketId)?.pricePaise ?? 0)}`} <ArrowRight size={16} /></button>
      </>}
    </section>
    <p className="demo-privacy-note"><LockKeyhole size={14} aria-hidden="true" /> Registration is confirmed only after Razorpay payment verification.</p>
  </main>;
}
