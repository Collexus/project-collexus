"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowDownRight,
  ArrowRight,
  Gift,
  CalendarDays,
  Check,
  CircleAlert,
  Clock3,
  LockKeyhole,
  ReceiptText,
  RotateCcw,
  Sparkles,
  TicketCheck,
  UtensilsCrossed,
} from "lucide-react";
import { ContentPage } from "@/components/content-page";
import styles from "./registration-history.module.css";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase-client";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

type EventStatus = "Ongoing" | "Registered" | "Closed";
type OrderStatus = "Completed" | "Failed" | "Refunded" | "Pending";
type EventPreview = { title: string; organizer: string; date: string; category: string; image: string; status: EventStatus };
type OrderPreview = { title: string; event: string; date: string; price: string; status: OrderStatus; reference: string };

const eventFilters: Array<"All" | EventStatus> = ["All", "Ongoing", "Registered", "Closed"];
const orderFilters: Array<"All" | OrderStatus> = ["All", "Pending", "Completed", "Failed", "Refunded"];

export function RegistrationHistory() {
  const [configured] = useState(() => isSupabaseConfigured());
  const [checking, setChecking] = useState(configured);
  const [accountError, setAccountError] = useState(false);
  const [view, setView] = useState<"events" | "orders">("events");
  const [eventFilter, setEventFilter] = useState<(typeof eventFilters)[number]>("All");
  const [orderFilter, setOrderFilter] = useState<(typeof orderFilters)[number]>("All");
  const [events, setEvents] = useState<EventPreview[]>([]);
  const [orders, setOrders] = useState<OrderPreview[]>([]);

  useEffect(() => {
    let active = true;
    const supabase = getSupabaseClient();
    if (!supabase) return;

    void supabase.auth.getUser().then(({ data, error }) => {
      if (!active) return;
      if (error || !data.user) {
        window.location.replace(`${basePath}/login/?next=%2Fregistrations%2F`);
        return;
      }
      void fetch("/api/payments/history", { cache: "no-store" }).then(async (response) => {
        const payload = await response.json() as { events?: Array<EventPreview & { date: string }>; orders?: Array<Omit<OrderPreview, "price" | "status" | "date"> & { pricePaise: number; status: string; date: string }> };
        if (!response.ok) throw new Error("Could not load your purchase history.");
        if (!active) return;
        setEvents((payload.events ?? []).map((event) => ({ ...event, date: new Date(event.date).toLocaleDateString("en-IN", { dateStyle: "medium" }) })));
        setOrders((payload.orders ?? []).map((order) => ({
          ...order,
          date: new Date(order.date).toLocaleDateString("en-IN", { dateStyle: "medium" }),
          price: `₹${(order.pricePaise / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          status: ["confirmed", "preparing", "ready", "collected"].includes(order.status) ? "Completed" : order.status === "refunded" ? "Refunded" : ["payment_failed", "cancelled"].includes(order.status) ? "Failed" : "Pending",
        })));
      }).catch(() => { if (active) setAccountError(true); }).finally(() => { if (active) setChecking(false); });
    }).catch(() => {
      if (active) {
        setAccountError(true);
        setChecking(false);
      }
    });
    return () => { active = false; };
  }, []);

  const visibleEvents = useMemo(() => eventFilter === "All" ? events : events.filter((event) => event.status === eventFilter), [eventFilter]);
  const visibleOrders = useMemo(() => orderFilter === "All" ? orders : orders.filter((order) => order.status === orderFilter), [orderFilter]);

  return (
    <ContentPage
      active="/registrations/"
      eyebrow="YOUR CAMPUS JOURNEY"
      title={view === "events" ? <>Registered <em className={styles.accent}>Events</em></> : <>Your <em className={styles.accent}>Orders</em></>}
      description={view === "events" ? "Your campus event activity, gathered in one clear view." : "A quick look at campus event purchases and their payment status."}
      illustration={<svg viewBox="0 0 420 260" role="img" aria-label="Illustration of students exploring campus events"><defs><linearGradient id="campus-bg" x1="0" x2="1" y1="0" y2="1"><stop stopColor="#dcfbf5"/><stop offset="1" stopColor="#e6e9ff"/></linearGradient></defs><rect x="8" y="8" width="404" height="244" rx="28" fill="url(#campus-bg)"/><circle cx="338" cy="70" r="34" fill="#fff" opacity=".75"/><path d="M54 194h310" stroke="#94cfc9" strokeWidth="5" strokeLinecap="round"/><path d="M74 193v-72l53-30 54 30v72M95 193v-44h24v44m86 0v-52h80v52m-62-52v-25h45v25" fill="#fff" stroke="#3a7f8c" strokeWidth="5" strokeLinejoin="round"/><circle cx="284" cy="111" r="18" fill="#f5b65d"/><path d="M257 192c2-36 13-54 28-54s27 18 29 54" fill="#087e83"/><circle cx="222" cy="130" r="15" fill="#d58c68"/><path d="M199 192c1-27 9-43 23-43s23 16 24 43" fill="#7662bd"/><rect x="320" y="125" width="40" height="30" rx="7" fill="#fff" stroke="#3a7f8c" strokeWidth="4"/><path d="M329 134h22m-22 8h16" stroke="#3a7f8c" strokeWidth="3" strokeLinecap="round"/><path d="M62 68l6 12 13 2-9 9 2 13-12-6-12 6 2-13-9-9 13-2z" fill="#f4b44f"/></svg>}
    >
      <section className={styles.activity} aria-label="Registrations and orders">
        <div className={styles.toolbar}>
          <div className={styles.viewTabs} role="tablist" aria-label="Activity type">
            <button type="button" role="tab" aria-selected={view === "events"} className={view === "events" ? styles.viewTabActive : styles.viewTab} onClick={() => setView("events")}>
              <TicketCheck size={16} aria-hidden="true" /> Registered Events <span>{events.length}</span>
            </button>
            <button type="button" role="tab" aria-selected={view === "orders"} className={view === "orders" ? styles.viewTabActive : styles.viewTab} onClick={() => setView("orders")}>
              <ReceiptText size={16} aria-hidden="true" /> Your Orders <span>{orders.length}</span>
            </button>
          </div>
          <div className={styles.previewFlag}><span aria-hidden="true" /> Private account history</div>
        </div>

        {checking ? (
          <div className={styles.notice} role="status"><Clock3 size={20} aria-hidden="true" /><div><strong>Checking your account</strong><p>Loading your private activity view…</p></div></div>
        ) : accountError ? (
          <div className={styles.notice} role="alert"><LockKeyhole size={20} aria-hidden="true" /><div><strong>We couldn’t check your account</strong><p>Refresh the page or sign in again to view your private activity.</p><Link href="/login/?next=%2Fregistrations%2F">Sign in again <ArrowRight size={14} /></Link></div></div>
        ) : configured ? (
          <div className={styles.notice}><LockKeyhole size={20} aria-hidden="true" /><div><strong>Your account is ready</strong><p>Only registrations and orders linked to this account are shown.</p></div></div>
        ) : null}

        {!checking && !accountError && (
          <>
            {view === "events" ? (
              <>
                <div className={styles.sectionHeading}>
                  <div><p className={styles.kicker}>EVENT ACTIVITY</p><h2>Your event registrations</h2><p>Payment confirmation comes from the payment service.</p></div>
                  <div className={styles.countCard}><strong>{events.length}</strong><span>registrations</span></div>
                </div>
                <div className={styles.filterRow} aria-label="Filter events">
                  {eventFilters.map((filter) => <button type="button" key={filter} aria-pressed={eventFilter === filter} className={eventFilter === filter ? styles.filterActive : styles.filter} onClick={() => setEventFilter(filter)}>{filter}<span>{filter === "All" ? events.length : events.filter((event) => event.status === filter).length}</span></button>)}
                </div>
                {visibleEvents.length ? <div className={styles.eventGrid}>
                  {visibleEvents.map((event) => <article className={styles.eventCard} key={event.title}>
                    <div className={styles.eventImage}>
                      <Image src={`${basePath}${event.image}`} alt="" fill sizes="(max-width: 700px) 100vw, (max-width: 1050px) 50vw, 33vw" />
                      <span className={styles.category}>{event.category}</span>
                      <span className={`${styles.status} ${styles[`status${event.status}`]}`}><i aria-hidden="true" />{event.status}</span>
                    </div>
                    <div className={styles.eventBody}>
                      <p className={styles.organizer}>{event.organizer}</p>
                      <h3>{event.title}</h3>
                      <p className={styles.eventDate}><CalendarDays size={15} aria-hidden="true" />{event.date}</p>
                      <Link className={styles.cardLink} href="/#featured-events">Explore event <ArrowRight size={15} aria-hidden="true" /></Link>
                    </div>
                  </article>)}
                </div> : <EmptyState label="No events in this status" description="Choose another status to see your event activity." />}
              </>
            ) : (
              <>
                <div className={styles.sectionHeading}>
                  <div><p className={styles.kicker}><Sparkles size={13} aria-hidden="true" /> ORDER ACTIVITY</p><h2>Your campus orders</h2><p>Your purchases and payment updates, all in one place.</p></div>
                  <div className={styles.countCard}><strong>{orders.length}</strong><span>orders</span></div>
                </div>
                <div className={styles.filterRow} aria-label="Filter orders">
                  {orderFilters.map((filter) => <button type="button" key={filter} aria-pressed={orderFilter === filter} className={orderFilter === filter ? styles.filterActive : styles.filter} onClick={() => setOrderFilter(filter)}>{filter}<span>{filter === "All" ? orders.length : orders.filter((order) => order.status === filter).length}</span></button>)}
                </div>
                {visibleOrders.length ? <div className={styles.orderGrid}>
                  {visibleOrders.map((order) => <article className={styles.orderCard} key={order.reference}>
                    <div className={styles.foodArt}><span><UtensilsCrossed size={29} aria-hidden="true" /></span><small>FEST STALL</small></div>
                    <div className={styles.orderBody}>
                      <div className={styles.orderTop}><span className={`${styles.status} ${styles[`status${order.status}`]}`}><i aria-hidden="true" />{order.status}</span><strong>{order.price}</strong></div>
                      <p className={styles.organizer}>{order.event}</p><h3>{order.title}</h3>
                      <div className={styles.orderMeta}><span><CalendarDays size={14} aria-hidden="true" />{order.date}</span><span>{order.reference}</span></div>
                      {order.status === "Refunded" && <p className={styles.orderFoot}><RotateCcw size={14} aria-hidden="true" />Refunded to the original payment method <ArrowDownRight size={14} aria-hidden="true" /></p>}
                      {order.status === "Failed" && <p className={styles.orderFoot}><CircleAlert size={14} aria-hidden="true" />Payment wasn’t completed</p>}
                      {order.status === "Completed" && <p className={styles.orderFoot}><Check size={14} aria-hidden="true" />Order marked complete</p>}
                    </div>
                  </article>)}
                </div> : <EmptyState label="No orders in this status" description="Choose another status to see your order activity." />}
              </>
            )}
          </>
        )}
      </section>
    </ContentPage>
  );
}

function EmptyState({ label, description }: { label: string; description: string }) {
  return <div className={styles.emptyState}><ReceiptText size={22} aria-hidden="true" /><h3>{label}</h3><p>{description}</p></div>;
}
