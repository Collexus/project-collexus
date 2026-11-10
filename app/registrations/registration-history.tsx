"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowDownRight,
  ArrowRight,
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
      illustration={<ActivityIllustration view={view} />}
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

function ActivityIllustration({ view }: { view: "events" | "orders" }) {
  const isOrders = view === "orders";
  return (
    <svg viewBox="0 0 420 260" role="img" aria-label={isOrders ? "Illustration of a campus food order and receipt" : "Illustration of an event pass and campus calendar"}>
      <defs>
        <linearGradient id="activity-scene" x1="0" x2="1" y1="0" y2="1"><stop stopColor="#d9f7f2" /><stop offset=".56" stopColor="#e6f0ff" /><stop offset="1" stopColor="#f7e9f7" /></linearGradient>
        <linearGradient id="activity-ticket" x1="0" x2="1" y1="0" y2="1"><stop stopColor="#087e83" /><stop offset="1" stopColor="#168eaa" /></linearGradient>
        <filter id="activity-shadow" x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="0" dy="10" stdDeviation="10" floodColor="#173d4a" floodOpacity=".15" /></filter>
      </defs>
      <rect x="8" y="8" width="404" height="244" rx="28" fill="url(#activity-scene)" />
      <circle cx="350" cy="51" r="38" fill="#fff" opacity=".58" />
      <circle cx="68" cy="204" r="26" fill="#fff" opacity=".36" />
      <path d="M42 216c60-16 105-16 154 0s100 16 182-3" fill="none" stroke="#9fd9d3" strokeWidth="4" strokeLinecap="round" />

      <g filter="url(#activity-shadow)" transform={isOrders ? "rotate(-7 126 130)" : "rotate(-5 126 130)"}>
        <rect x="42" y="52" width="164" height="150" rx="19" fill="#fff" />
        <path d="M42 71a19 19 0 0 1 19-19h126a19 19 0 0 1 19 19v23H42z" fill="url(#activity-ticket)" />
        <circle cx="64" cy="72" r="5" fill="#d9f7f2" />
        <path d="M80 68h74m-74 9h45" stroke="#e8fffd" strokeWidth="4" strokeLinecap="round" opacity=".9" />
        {isOrders ? (
          <>
            <path d="M69 122h110m-110 16h84m-84 16h94" stroke="#cbd9df" strokeWidth="5" strokeLinecap="round" />
            <circle cx="164" cy="175" r="15" fill="#fff2d7" />
            <path d="m157 175 5 5 10-11" fill="none" stroke="#bb7c20" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </>
        ) : (
          <>
            <rect x="62" y="111" width="40" height="43" rx="8" fill="#e5f6f4" />
            <path d="M62 122h40" stroke="#61bdb8" strokeWidth="4" />
            <path d="M72 105v12m20-12v12" stroke="#087e83" strokeWidth="4" strokeLinecap="round" />
            <path d="M75 134h6m-6 10h6m11-10h6m-6 10h6" stroke="#168eaa" strokeWidth="4" strokeLinecap="round" />
            <path d="M122 119h53m-53 16h40m-40 16h50" stroke="#cbd9df" strokeWidth="5" strokeLinecap="round" />
            <path d="m159 174 5 5 10-11" fill="none" stroke="#087e83" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </>
        )}
      </g>

      <g filter="url(#activity-shadow)" transform={isOrders ? "rotate(7 285 153)" : "rotate(7 285 153)"}>
        <path d="M214 98h137v94l-12-7-12 7-12-7-12 7-12-7-12 7-12-7-12 7-12-7-11 7z" fill="#fff" />
        <path d="M232 116h94" stroke="#c8d9df" strokeWidth="5" strokeLinecap="round" />
        <path d="M232 130h70" stroke="#c8d9df" strokeWidth="5" strokeLinecap="round" />
        {isOrders ? (
          <>
            <circle cx="279" cy="163" r="20" fill="#fff0d8" />
            <path d="M264 160c4-10 25-10 30 0m-32 5c6 8 27 8 34 0" fill="none" stroke="#d99a3f" strokeWidth="4" strokeLinecap="round" />
            <circle cx="279" cy="163" r="7" fill="#ee8c55" />
            <path d="M268 141c-4-5 4-7 0-12m12 12c-4-5 4-7 0-12m12 12c-4-5 4-7 0-12" fill="none" stroke="#168eaa" strokeWidth="3" strokeLinecap="round" />
          </>
        ) : (
          <>
            <rect x="236" y="145" width="57" height="31" rx="7" fill="url(#activity-ticket)" />
            <path d="M247 155h24m-24 8h33" stroke="#e8fffd" strokeWidth="3" strokeLinecap="round" />
            <circle cx="317" cy="160" r="19" fill="#fff2d7" />
            <path d="m309 160 6 6 11-13" fill="none" stroke="#bb7c20" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
          </>
        )}
      </g>

      <g fill={isOrders ? "#e6a746" : "#087e83"}>
        <path d="m355 89 5 10 11 2-8 8 2 11-10-5-10 5 2-11-8-8 11-2z" />
        <circle cx="207" cy="64" r="5" opacity=".72" />
        <circle cx="373" cy="193" r="4" opacity=".55" />
      </g>
      <path d="m209 46 3 7 8 1-6 5 1 7-6-4-7 4 2-7-6-5 8-1z" fill="#ed9f55" />
    </svg>
  );
}

function EmptyState({ label, description }: { label: string; description: string }) {
  return <div className={styles.emptyState}><ReceiptText size={22} aria-hidden="true" /><h3>{label}</h3><p>{description}</p></div>;
}
