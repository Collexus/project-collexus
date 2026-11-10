"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, CircleAlert, Minus, Plus, ShoppingBag, UtensilsCrossed } from "lucide-react";
import { ContentPage } from "@/components/content-page";
import { getSupabaseClient } from "@/lib/supabase-client";
import styles from "./cart.module.css";

type MenuItem = { id: string; name: string; description: string | null; pricePaise: number };
type Stall = { id: string; name: string; slug: string; location: string | null; menuItems: MenuItem[] };
type CartLine = MenuItem & { quantity: number };
type RazorpayCheckout = { open: () => void };
type RazorpayOptions = {
  key: string; order_id: string; amount: number; currency: string; name: string; description: string;
  handler: (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => void;
  modal: { ondismiss: () => void };
  theme: { color: string };
};
declare global { interface Window { Razorpay?: new (options: RazorpayOptions) => RazorpayCheckout } }

const money = (paise: number) => `₹${(paise / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

async function loadRazorpay() {
  if (window.Razorpay) return;
  await new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
    const script = existing ?? document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Razorpay checkout could not load. Check your connection and try again."));
    if (!existing) document.body.appendChild(script);
  });
  if (!window.Razorpay) throw new Error("Razorpay checkout is unavailable.");
}

export function CartExperience() {
  const router = useRouter();
  const [stalls, setStalls] = useState<Stall[]>([]);
  const [cart, setCart] = useState<Record<string, CartLine>>({});
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const checkoutKey = useRef<string | null>(null);
  const lines = Object.values(cart);
  const subtotal = useMemo(() => lines.reduce((sum, line) => sum + line.pricePaise * line.quantity, 0), [lines]);
  const count = lines.reduce((sum, line) => sum + line.quantity, 0);

  useEffect(() => {
    let active = true;
    void fetch("/api/food/menu", { cache: "no-store" }).then(async (response) => {
      const payload = await response.json() as { stalls?: Stall[]; error?: string };
      if (!response.ok) throw new Error(payload.error || "The live menu could not be loaded.");
      if (active) setStalls(payload.stalls ?? []);
    }).catch((error: unknown) => {
      if (active) setNotice(error instanceof Error ? error.message : "The live menu could not be loaded.");
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  function changeQuantity(item: MenuItem, quantity: number) {
    checkoutKey.current = null;
    setCart((current) => {
      const next = { ...current };
      if (quantity <= 0) delete next[item.id];
      else next[item.id] = { ...item, quantity: Math.min(20, quantity) };
      return next;
    });
    setNotice("");
  }

  async function checkout() {
    setNotice("");
    if (new Set(lines.map((line) => stalls.find((stall) => stall.menuItems.some((item) => item.id === line.id))?.id)).size > 1) {
      setNotice("Place separate orders for each stall. Remove items from the other stall to continue.");
      return;
    }
    if (name.trim().length < 2 || phone.trim().length < 7) {
      setNotice("Enter your name and a phone number so the stall can prepare your order.");
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
        body: JSON.stringify({ kind: "food_order", customerName: name.trim(), customerPhone: phone.trim(), items: lines.map(({ id, quantity }) => ({ menuItemId: id, quantity })) }),
      });
      const purchase = await response.json() as { paymentId?: string; error?: string };
      if (!response.ok || !purchase.paymentId) throw new Error(purchase.error || "Could not prepare the order.");
      const { data: orderData, error: orderError } = await supabase.functions.invoke("razorpay-payments", { body: { action: "create_order", payment_id: purchase.paymentId } });
      if (orderError || !orderData?.order_id || !orderData?.key_id) throw new Error(orderData?.error || orderError?.message || "Could not start payment.");
      await loadRazorpay();
      const checkoutWindow = new window.Razorpay!({
        key: orderData.key_id, order_id: orderData.order_id, amount: orderData.amount, currency: orderData.currency,
        name: "Collexus", description: `Food order · ${count} item${count === 1 ? "" : "s"}`,
        theme: { color: "#087e83" },
        modal: { ondismiss: () => setBusy(false) },
        handler: (details) => {
          void supabase.functions.invoke("razorpay-payments", { body: { action: "verify_payment", payment_id: purchase.paymentId, ...details } })
            .then(({ data, error }) => {
              if (error || data?.status !== "paid") throw new Error(data?.error || error?.message || "Payment is still being confirmed. Check your order history in a moment.");
              checkoutKey.current = null;
              setCart({});
              router.push("/registrations/?payment=success");
            }).catch((error: unknown) => setNotice(error instanceof Error ? error.message : "Payment confirmation is pending."))
            .finally(() => setBusy(false));
        },
      });
      checkoutWindow.open();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Could not start checkout. Please try again.");
      setBusy(false);
    }
  }

  return <ContentPage active="/cart/" eyebrow="CAMPUS FOOD" title={<>Food <em className={styles.accent}>orders</em></>} description="Choose items from an active campus stall. Prices and totals are checked against the live menu when you pay.">
    <section className={styles.cartShell} aria-label="Campus food ordering">
      <div className={styles.cartTopline}><Link className={`${styles.backLink} site-back-link`} href="/registrations/"><ArrowLeft size={15} aria-hidden="true" /> Your orders</Link><span className={styles.previewBadge}><i aria-hidden="true" /> LIVE MENU</span></div>
      {notice && <p className={styles.disclaimer} role="alert"><CircleAlert size={15} aria-hidden="true" /> {notice}</p>}
      {loading ? <p aria-live="polite">Loading available stalls…</p> : stalls.length === 0 ? <div className={styles.emptyCart}><ShoppingBag size={28} aria-hidden="true" /><h3>No active food menus yet</h3><p>Once an administrator activates a stall and publishes available menu items, they will appear here for ordering.</p><Link href="/help/">Get help <ArrowRight size={15} aria-hidden="true" /></Link></div> : <div className={styles.cartLayout}>
        <section className={styles.itemsPanel} aria-label="Active stalls and menus">
          {stalls.map((stall) => <section key={stall.id} style={{ marginBottom: 24 }}><div className={styles.panelHeading}><div><span className={styles.kicker}>{stall.location || "CAMPUS STALL"}</span><h2>{stall.name}</h2></div></div><div className={styles.itemList}>
            {stall.menuItems.map((item) => { const quantity = cart[item.id]?.quantity ?? 0; return <article className={styles.itemRow} key={item.id}>
              <div className={styles.itemArtwork}><UtensilsCrossed size={23} aria-hidden="true" /></div><div className={styles.itemInfo}><h3>{item.name}</h3>{item.description && <span className={styles.vendor}>{item.description}</span>}<span className={styles.unitPrice}>{money(item.pricePaise)} <small>each</small></span></div>
              <div className={styles.itemActions}>{quantity ? <div className={styles.quantityControl}><button aria-label={`Remove one ${item.name}`} disabled={busy} onClick={() => changeQuantity(item, quantity - 1)} type="button"><Minus size={14} /></button><span aria-live="polite">{quantity}</span><button aria-label={`Add one ${item.name}`} disabled={busy || quantity >= 20} onClick={() => changeQuantity(item, quantity + 1)} type="button"><Plus size={14} /></button></div> : <button className={styles.checkoutButton} disabled={busy} type="button" onClick={() => changeQuantity(item, 1)}>Add <Plus size={14} /></button>}</div>
            </article>; })}
          </div></section>)}
        </section>
        <aside className={styles.summaryPanel} aria-label="Order summary"><div className={styles.summaryHeading}><span className={styles.kicker}>PAYMENT DETAILS</span><h2>Order summary</h2><p>{count} {count === 1 ? "item" : "items"}</p></div>
          <dl className={styles.billLines}><div><dt>Items total</dt><dd>{money(subtotal)}</dd></div><div className={styles.grandTotal}><dt>Total payable</dt><dd>{money(subtotal)}</dd></div></dl>
          <label className={styles.customerField}>Name<input value={name} onChange={(event) => { checkoutKey.current = null; setName(event.target.value); }} autoComplete="name" maxLength={160} /></label>
          <label className={styles.customerField}>Phone<input value={phone} onChange={(event) => { checkoutKey.current = null; setPhone(event.target.value); }} autoComplete="tel" maxLength={40} /></label>
          <button className={styles.checkoutButton} disabled={!lines.length || busy} onClick={() => void checkout()} type="button">{busy ? "Preparing secure checkout…" : "Pay securely"} <ArrowRight size={17} aria-hidden="true" /></button>
          <p className={styles.secureNote}><span aria-hidden="true">✓</span> Prices are rechecked on the server before payment.</p>
        </aside>
      </div>}
      <p className={styles.disclaimer}><CircleAlert size={14} aria-hidden="true" /> Payment confirmation is recorded by Razorpay verification or its signed webhook. A browser success message alone does not confirm an order.</p>
    </section>
  </ContentPage>;
}
