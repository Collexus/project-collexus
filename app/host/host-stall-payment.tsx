"use client";

import { useRef, useState } from "react";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase-client";
import styles from "./host.module.css";

type StallType = "Silver stall" | "Gold stall" | "Platinum stall";
type Plan = "normal" | "pro";
type RazorpayOptions = {
  key: string; amount: number; currency: string; name: string; description: string; order_id: string;
  handler: (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => void;
  modal: { ondismiss: () => void };
  theme: { color: string };
};
declare global { interface Window { Razorpay?: new (options: RazorpayOptions) => { open: () => void }; } }

async function ensureCheckoutScript() {
  if (window.Razorpay) return;
  await new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-razorpay-checkout="true"]');
    const script = existing ?? document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.dataset.razorpayCheckout = "true";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Could not load Razorpay checkout. Check your connection and try again."));
    if (!existing) document.body.appendChild(script);
  });
  if (!window.Razorpay) throw new Error("Razorpay checkout did not load. Please try again.");
}

export function HostStallPayment({
  listingName, stallType, plan, addOns,
}: { listingName: string; stallType: StallType; plan: Plan; addOns: string[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const idempotencyKey = useRef("");

  async function startPayment() {
    setBusy(true);
    setMessage("");
    try {
      const supabase = getSupabaseClient();
      const { data: sessionData } = supabase ? await supabase.auth.getSession() : { data: { session: null } };
      if (!sessionData.session) {
        router.push(`/login/?next=${encodeURIComponent(window.location.pathname + window.location.search)}`);
        return;
      }
      if (!idempotencyKey.current) idempotencyKey.current = crypto.randomUUID();
      const response = await fetch("/api/payments/host-stall", {
        method: "POST", headers: { "Content-Type": "application/json", "Idempotency-Key": idempotencyKey.current },
        body: JSON.stringify({ listingName, stallType, plan, addOns }),
      });
      const prepared = await response.json() as { paymentId?: string; error?: string };
      if (!response.ok || !prepared.paymentId) throw new Error(prepared.error ?? "Could not prepare payment.");
      if (!supabase) throw new Error("Payment service is unavailable. Please try again later.");
      const { data: order, error: orderError } = await supabase.functions.invoke("razorpay-payments", {
        body: { action: "create_order", payment_id: prepared.paymentId },
      });
      if (orderError || !order?.order_id || !order?.key_id) throw new Error(order?.error ?? orderError?.message ?? "Could not start Razorpay checkout.");
      await ensureCheckoutScript();
      const checkout = new window.Razorpay!({
        key: order.key_id, amount: order.amount, currency: order.currency, name: "Collexus",
        description: `${stallType} · Collexus ${plan === "pro" ? "Pro" : "Normal"}`,
        order_id: order.order_id, theme: { color: "#087e83" },
        modal: { ondismiss: () => setBusy(false) },
        handler: async (result) => {
          const { data, error } = await supabase.functions.invoke("razorpay-payments", {
            body: { action: "verify_payment", payment_id: prepared.paymentId, ...result },
          });
          if (error || data?.status !== "paid") {
            setBusy(false);
            setMessage(data?.error ?? "Payment could not be verified yet. Refresh your order status before trying again.");
            return;
          }
          const params = new URLSearchParams({ payment: "success", plan, listingName, stallType });
          if (addOns.length) params.set("addons", addOns.join(","));
          router.push(`/stall-registration/?${params.toString()}`);
        },
      });
      checkout.open();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not start payment. Please try again.");
      setBusy(false);
    }
  }

  return <>
    <button className={styles.checkoutButton} disabled={busy} onClick={startPayment} type="button">
      {busy ? <><LoaderCircle size={16} aria-hidden="true" /> Opening secure checkout…</> : <>Continue to secure payment <ArrowRight size={17} aria-hidden="true" /></>}
    </button>
    {message && <p role="alert" style={{ color: "#a43131", fontSize: 12, lineHeight: 1.5, margin: "10px 0 0" }}>{message}</p>}
  </>;
}
