"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { nanoid } from "nanoid";
import { ArrowLeft, ArrowRight, Check, CircleAlert, Minus, Plus, ShoppingBag, Tag, Trash2, UtensilsCrossed } from "lucide-react";
import { ContentPage } from "@/components/content-page";
import { storeConfirmation } from "@/lib/confirmation";
import styles from "./cart.module.css";

const initialItems = [
  { id: "biryani", name: "Chicken Biryani", vendor: "Kreya ’26 · Fest stall", price: 160, quantity: 1 },
  { id: "ice-cream", name: "Ice Cream", vendor: "Kreya ’26 · Fest stall", price: 60, quantity: 1 },
  { id: "shawarma", name: "Shawarma Roll", vendor: "Kreya ’26 · Fest stall", price: 120, quantity: 1 },
];

const money = (value: number) => `₹${value.toLocaleString("en-IN")}`;

export function CartExperience() {
  const router = useRouter();
  const [items, setItems] = useState(initialItems);
  const [couponInput, setCouponInput] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponMessage, setCouponMessage] = useState("");

  const subtotal = useMemo(() => items.reduce((sum, item) => sum + item.price * item.quantity, 0), [items]);
  const discount = couponApplied ? Math.round(subtotal * 0.1) : 0;
  const feeBase = subtotal - discount;
  const platformFee = Math.round(feeBase * 0.005);
  const gatewayFee = Math.round(feeBase * 0.02);
  const gatewayGst = Math.round(gatewayFee * 0.18);
  const total = feeBase + platformFee + gatewayFee + gatewayGst;
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  function updateQuantity(id: string, quantity: number) {
    setItems((current) => current.map((item) => item.id === id ? { ...item, quantity } : item));
  }

  function previewOrder() {
    let account: Record<string, unknown> = {};
    try { account = JSON.parse(window.localStorage.getItem("collexus:account-profile-draft") ?? "{}"); } catch { account = {}; }
    try {
      storeConfirmation({
        kind: "order",
        status: "preview",
        reference: `CX-${nanoid(12).toUpperCase()}`,
        createdAt: new Date().toISOString(),
        name: typeof account.full_name === "string" && account.full_name ? account.full_name : "Collexus guest",
        email: typeof account.email === "string" ? account.email : undefined,
        phone: typeof account.profile_phone === "string" ? account.profile_phone : undefined,
        collegeId: typeof account.campus_id === "string" ? account.campus_id : undefined,
        image: typeof account.profile_avatar_url === "string" && /^(https?:|data:image\/)/i.test(account.profile_avatar_url) ? account.profile_avatar_url : undefined,
        title: "Kreya ’26 · Fest stall",
        subtitle: "Order summary preview",
        items: items.map((item) => ({ name: item.name, quantity: item.quantity, total: item.price * item.quantity })),
        amount: total,
        pricing: { subtotal, discount, platformFee, gatewayFeeWithGst: gatewayFee + gatewayGst, total },
      });
      router.push("/confirmation/");
    } catch { setCouponMessage("Your browser couldn’t open the order confirmation preview."); }
  }

  function applyCoupon() {
    if (couponInput.trim().toUpperCase() === "CAMPUS10") {
      setCouponApplied(true);
      setCouponInput("CAMPUS10");
      setCouponMessage("CAMPUS10 applied · 10% off your items total.");
    } else {
      setCouponApplied(false);
      setCouponMessage("That coupon isn’t valid. Try CAMPUS10 for this cart preview.");
    }
  }

  function removeCoupon() {
    setCouponApplied(false);
    setCouponInput("");
    setCouponMessage("Coupon removed.");
  }

  return (
    <ContentPage
      active="/cart/"
      eyebrow="YOUR ORDER"
      title={<>Your <em className={styles.accent}>Cart</em></>}
      description="Check your items, add a coupon and see every fee before checkout."
      illustration={<svg viewBox="0 0 420 260" role="img" aria-label="Illustration of students ordering from a colorful campus fest food stall"><defs><linearGradient id="cart-bg" x1="0" x2="1" y1="0" y2="1"><stop stopColor="#c9f6ee"/><stop offset=".56" stopColor="#e9edff"/><stop offset="1" stopColor="#fff0d7"/></linearGradient><linearGradient id="awning" x1="0" x2="1"><stop stopColor="#087e83"/><stop offset="1" stopColor="#39b6a9"/></linearGradient><linearGradient id="cup" x1="0" x2="1"><stop stopColor="#ffc96d"/><stop offset="1" stopColor="#f38c71"/></linearGradient><filter id="cart-shadow" x="-.3" y="-.3" width="1.6" height="1.8"><feDropShadow dx="0" dy="8" stdDeviation="7" floodColor="#1b6270" floodOpacity=".13"/></filter></defs><rect x="7" y="7" width="406" height="246" rx="30" fill="url(#cart-bg)"/><circle cx="355" cy="49" r="24" fill="#fff" opacity=".52"/><circle cx="68" cy="56" r="34" fill="#fff" opacity=".38"/><path d="M28 217h365" stroke="#83c6bc" strokeWidth="3" strokeLinecap="round"/><path d="M43 95h334v119H43z" fill="#fffdf8" filter="url(#cart-shadow)"/><path d="M30 92 60 45h300l30 47z" fill="url(#awning)"/><path d="m30 92 45-47 29 47 45-47 48 47 45-47 44 47 43-47 41 47" fill="none" stroke="#effffb" strokeWidth="16" strokeLinejoin="round"/><path d="M51 95v19m307-19v19" stroke="#0a6973" strokeWidth="5"/><rect x="69" y="123" width="111" height="72" rx="9" fill="#e5f8f3" stroke="#b9e3db" strokeWidth="2"/><text x="124" y="145" textAnchor="middle" fontFamily="Arial,sans-serif" fontSize="9" fontWeight="700" letterSpacing="1.4" fill="#087e83">FEST MENU</text><path d="M91 157h67m-67 12h50m-50 12h60" stroke="#77afa8" strokeWidth="3" strokeLinecap="round"/><rect x="206" y="126" width="107" height="68" rx="10" fill="#fff0d3"/><ellipse cx="259" cy="176" rx="38" ry="10" fill="#e2a254"/><path d="M220 161q39-34 78 0l-8 17h-62z" fill="#fffaf1" stroke="#d8a16a" strokeWidth="3"/><circle cx="246" cy="156" r="6" fill="#e89857"/><circle cx="263" cy="152" r="6" fill="#7ab67f"/><circle cx="278" cy="158" r="5" fill="#f2c64e"/><path d="M221 146c-13-15-14-25-7-30 9-6 18 2 15 15 12-16 26-17 30-8 4 9-6 18-22 19" fill="#56a879"/><path d="M324 136h25v45h-25z" fill="url(#cup)"/><path d="M329 130h15m-8 0v-12" stroke="#d46d59" strokeWidth="4" strokeLinecap="round"/><path d="M91 101v-8m62 8v-8m62 8v-8m62 8v-8m62 8v-8" stroke="#ffd482" strokeWidth="5" strokeLinecap="round"/><circle cx="101" cy="218" r="11" fill="#f5b648"/><circle cx="306" cy="218" r="11" fill="#f5b648"/><path d="M55 77l5-9m305 9-5-9" stroke="#fff" strokeWidth="3" strokeLinecap="round"/><path d="M350 187c14-14 27-14 35-3-13 5-20 12-23 24m-294-8c-12-12-24-12-31-2 10 3 17 10 20 20" fill="#5eaa7d"/><path d="M352 55l5 10 11 2-8 7 2 11-10-5-10 5 2-11-8-7 11-2z" fill="#f4b44f"/><circle cx="191" cy="61" r="4" fill="#ee8e75"/><circle cx="207" cy="52" r="3" fill="#f4b44f"/><circle cx="220" cy="62" r="4" fill="#7e79c8"/></svg>}
    >
      <section className={styles.cartShell} aria-label="Shopping cart">
        <div className={styles.cartTopline}>
          <Link className={styles.backLink} href="/registrations/"><ArrowLeft size={15} aria-hidden="true" /> Your orders</Link>
          <span className={styles.previewBadge}><i aria-hidden="true" /> SAMPLE CART</span>
        </div>

        <div className={styles.cartLayout}>
          <section className={styles.itemsPanel} aria-labelledby="cart-items-title">
            <div className={styles.panelHeading}>
              <div><span className={styles.kicker}>KREYA ’26 · FEST STALL</span><h2 id="cart-items-title">Items in your cart</h2></div>
              <span className={styles.itemCount}>{itemCount} items</span>
            </div>

            {items.length ? <div className={styles.itemList}>
              {items.map((item) => <article className={styles.itemRow} key={item.id}>
                <div className={styles.itemArtwork}><UtensilsCrossed size={23} aria-hidden="true" /><span>FEST</span></div>
                <div className={styles.itemInfo}><span className={styles.vendor}>{item.vendor}</span><h3>{item.name}</h3><span className={styles.unitPrice}>{money(item.price)} <small>each</small></span></div>
                <div className={styles.itemActions}>
                  <div className={styles.quantityControl} aria-label={`Quantity for ${item.name}`}>
                    <button aria-label={`Remove one ${item.name}`} disabled={item.quantity <= 1} onClick={() => updateQuantity(item.id, item.quantity - 1)} type="button"><Minus size={14} aria-hidden="true" /></button>
                    <span aria-live="polite">{item.quantity}</span>
                    <button aria-label={`Add one ${item.name}`} onClick={() => updateQuantity(item.id, item.quantity + 1)} type="button"><Plus size={14} aria-hidden="true" /></button>
                  </div>
                  <strong className={styles.lineTotal}>{money(item.price * item.quantity)}</strong>
                  <button className={styles.removeButton} aria-label={`Remove ${item.name} from cart`} onClick={() => setItems((current) => current.filter((entry) => entry.id !== item.id))} type="button"><Trash2 size={15} aria-hidden="true" /><span>Remove</span></button>
                </div>
              </article>)}
            </div> : <div className={styles.emptyCart}><ShoppingBag size={28} aria-hidden="true" /><h3>Your cart is empty</h3><p>Browse campus events to find a fest stall and add something you like.</p><Link href="/#featured-events">Explore events <ArrowRight size={15} aria-hidden="true" /></Link></div>}

            {items.length > 0 && <div className={styles.addMore}><span><strong>Looking for more?</strong><small>Explore campus events and their fest stalls.</small></span><Link href="/#featured-events" aria-label="Browse events"><ArrowRight size={17} aria-hidden="true" /></Link></div>}

            <div className={styles.couponCard}>
              <span className={styles.couponIcon}><Tag size={17} aria-hidden="true" /></span>
              <div className={styles.couponContent}><label htmlFor="cart-coupon">Have a coupon?</label><p>Enter a code to see your discount in the bill.</p><div className={styles.couponInputRow}><input id="cart-coupon" autoComplete="off" maxLength={24} onChange={(event) => { setCouponInput(event.target.value); setCouponMessage(""); }} placeholder="Enter coupon code" value={couponInput} disabled={couponApplied || !items.length} /><button type="button" onClick={couponApplied ? removeCoupon : applyCoupon} disabled={!items.length || (!couponApplied && !couponInput.trim())}>{couponApplied ? "Remove" : "Apply"}</button></div>{couponMessage && <p className={couponApplied ? styles.couponSuccess : styles.couponError} role="status">{couponApplied && <Check size={14} aria-hidden="true" />}{couponMessage}</p>}<small className={styles.couponHint}>Preview code: CAMPUS10 · 10% off items</small></div>
            </div>
          </section>

          <aside className={styles.summaryPanel} aria-labelledby="bill-title">
            <div className={styles.summaryHeading}><span className={styles.kicker}>PAYMENT DETAILS</span><h2 id="bill-title">Bill summary</h2><p>{itemCount} {itemCount === 1 ? "item" : "items"} · fees shown before payment</p></div>
            <dl className={styles.billLines}>
              <div><dt>Items total</dt><dd>{money(subtotal)}</dd></div>
              {couponApplied && <div className={styles.discountLine}><dt>Coupon discount</dt><dd>−{money(discount)}</dd></div>}
              <div><dt>Platform fee <small>(0.5%)</small></dt><dd>{money(platformFee)}</dd></div>
              <div><dt>Payment gateway and GST <small>(2% fee + 18% GST)</small></dt><dd>{money(gatewayFee + gatewayGst)}</dd></div>
              <div className={styles.grandTotal}><dt>Total payable</dt><dd>{money(total)}</dd></div>
            </dl>
            <p className={styles.feeNote}>Platform and payment fees are calculated on the items total after any coupon discount. GST applies to the payment gateway fee.</p>
            <button className={styles.checkoutButton} disabled={!items.length} onClick={previewOrder} type="button">Preview order confirmation <ArrowRight size={17} aria-hidden="true" /></button>
            <p className={styles.secureNote}><span aria-hidden="true">✓</span> Review the full bill before you pay</p>
          </aside>
        </div>
        <p className={styles.disclaimer}><CircleAlert size={14} aria-hidden="true" /> Sample cart for layout preview. Items, coupons and checkout are not connected to a live vendor or payment provider.</p>
      </section>
    </ContentPage>
  );
}
