import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarDays, ClipboardCheck, MapPin } from "lucide-react";
import { ApiError } from "@/lib/backend/errors";
import { events } from "@/data/events";
import { getPrisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import styles from "@/app/host-panels.module.css";

export const metadata: Metadata = {
  title: "Staff event panel | Collexus",
  description: "View the Collexus events assigned to your staff account.",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function StaffPanelPage() {
  if (!process.env.DATABASE_URL) {
    return <main className={styles.page}><div className={styles.container}><section className={styles.empty}><strong>Staff access is not connected yet</strong><p>The staff panel needs the server database connection and staff assignment tables.</p><Link className={styles.actionLink} href="/">Return to Collexus</Link></section></div></main>;
  }

  let user;
  try {
    ({ user } = await requireRole("staff"));
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) redirect(`/login/?next=${encodeURIComponent("/staff-panel/")}`);
    if (error instanceof ApiError && error.status === 403) {
      return <main className={styles.page}><div className={styles.container}><section className={styles.empty}><strong>Staff access is not active</strong><p>An administrator must grant your account the staff role and assign you to an event before this panel appears in your account menu.</p><Link className={styles.actionLink} href="/profile/">Return to your account</Link></section></div></main>;
    }
    throw error;
  }

  const assignments = await getPrisma().staffEventAssignment.findMany({
    where: { staffUserId: user.id, revokedAt: null },
    orderBy: { createdAt: "desc" },
    select: { eventSlug: true },
  });
  const eventBySlug = new Map(events.map((event) => [event.slug, event]));
  const assignedEvents = assignments.flatMap(({ eventSlug }) => {
    const event = eventBySlug.get(eventSlug);
    return event ? [event] : [];
  });

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <div className={styles.topbar}><Link className={styles.brand} href="/">COLLEXUS · EVENT STAFF</Link><nav aria-label="Staff panel navigation"><Link href="/profile/">Profile</Link></nav></div>
        <section className={styles.hero}>
          <div><p className={styles.eyebrow}>EVENT OPERATIONS</p><h1>Your staff workspace</h1><p>Only events assigned to your staff account are listed here. An administrator controls these assignments.</p></div>
          <span className={styles.heroIcon} aria-hidden="true"><ClipboardCheck size={28} /></span>
        </section>
        <section className={styles.section} aria-labelledby="assigned-events-heading">
          <div className={styles.sectionHead}><div><h2 id="assigned-events-heading">Assigned events</h2><p>Contact an administrator if an event is missing or your assignment has ended.</p></div><span className={styles.count}>{assignedEvents.length} events</span></div>
          {assignedEvents.length === 0 ? <div className={styles.empty}><strong>No active event assignments</strong><p>Your staff role is active, but no current event assignment is available.</p><Link className={styles.actionLink} href="/profile/">Return to your account</Link></div> : (
            <div className={styles.list}>
              {assignedEvents.map((event) => <article className={styles.card} key={event.slug}>
                <h3>{event.title}</h3>
                <p className={styles.meta}><span><CalendarDays size={13} aria-hidden="true" /> {event.dateLabel}</span><span><MapPin size={13} aria-hidden="true" /> {event.venue}</span></p>
              </article>)}
            </div>
          )}
          <p className={styles.footnote}>Registration lookup and QR check-in are not available in this panel yet.</p>
        </section>
      </div>
    </main>
  );
}
