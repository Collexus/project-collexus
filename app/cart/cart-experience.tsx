"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, CircleAlert, Minus, Plus, ShoppingBag, Tag, Trash2, UtensilsCrossed } from "lucide-react";
import { ContentPage } from "@/components/content-page";
import styles from "./cart.module.css";

const initialItems = [
  { id: "biryani", name: "Chicken Biryani", vendor: "Kreya ’26 · Fest stall", price: 160, quantity: 1 },
  { id: "ice-cream", name: "Ice Cream", vendor: "Kreya ’26 · Fest stall", price: 60, quantity: 1 },
  { id: "shawarma", name: "Shawarma Roll", vendor: "Kreya ’26 · Fest stall", price: 120, quantity: 1 },
];

const money = (value: number) => `₹${value.toLocaleString("en-IN")}`;

export function CartExperience() {
  const [items, setItems] = useState(initialItems);
  const [couponInput, setCouponInput] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponMessage, setCouponMessage] = useState("");
  const [checkoutPreview, setCheckoutPreview] = useState(false);

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
    setCheckoutPreview(false);
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
      illustration={<svg viewBox="0 0 420 260" role="img" aria-label="Illustration of a campus food order"><defs><linearGradient id="cart-bg" x1="0" x2="1" y1="0" y2="1"><stop stopColor="#dcfbf5"/><stop offset="1" stopColor="#f7e9ff"/></linearGradient></defs><rect x="8" y="8" width="404" height="244" rx="28" fill="url(#cart-bg)"/><circle cx="210" cy="124" r="72" fill="#fff" opacity=".72"/><path d="M139 126h142l-13 65h-116z" fill="#fff" stroke="#087e83" strokeWidth="6" strokeLinejoin="round"/><path d="M169 125c0-23 17-42 38-42s38 19 38 42" fill="none" stroke="#087e83" strokeWidth="6" strokeLinecap="round"/><path d="M174 150h70m-64 19h58" stroke="#75bbb4" strokeWidth="5" strokeLinecap="round"/><circle cx="165" cy="207" r="10" fill="#f3b24e"/><circle cx="254" cy="207" r="10" fill="#f3b24e"/><path d="M311 84l6 12 13 2-9 9 2 13-12-6-12 6 2-13-9-9 13-2z" fill="#f4b44f"/></svg>}
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
                  <button className={styles.removeButton} aria-label={`Remove ${item.name} from cart`} onClick={() => { setItems((current) => current.filter((entry) => entry.id !== item.id)); setCheckoutPreview(false); }} type="button"><Trash2 size={15} aria-hidden="true" /><span>Remove</span></button>
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
              <div><dt>Payment gateway fee <small>(2%)</small></dt><dd>{money(gatewayFee)}</dd></div>
              <div><dt>GST on gateway fee <small>(18% of fee)</small></dt><dd>{money(gatewayGst)}</dd></div>
              <div className={styles.grandTotal}><dt>Total payable</dt><dd>{money(total)}</dd></div>
            </dl>
            <p className={styles.feeNote}>Platform and payment fees are calculated on the items total after any coupon discount. GST applies to the payment gateway fee.</p>
            {checkoutPreview && <p className={styles.checkoutMessage} role="status"><CircleAlert size={15} aria-hidden="true" /> Checkout is a preview; no order or payment was sent.</p>}
            <button className={styles.checkoutButton} disabled={!items.length} onClick={() => setCheckoutPreview(true)} type="button">Continue to checkout <ArrowRight size={17} aria-hidden="true" /></button>
            <p className={styles.secureNote}><span aria-hidden="true">✓</span> Review the full bill before you pay</p>
          </aside>
        </div>
        <p className={styles.disclaimer}><CircleAlert size={14} aria-hidden="true" /> Sample cart for layout preview. Items, coupons and checkout are not connected to a live vendor or payment provider.</p>
      </section>
    </ContentPage>
  );
}
