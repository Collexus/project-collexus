import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarDays, ExternalLink, MapPin } from "lucide-react";
import { ApiError } from "@/lib/backend/errors";
import { eventSubmissionSchema } from "@/lib/backend/schemas";
import { getPrisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import styles from "@/app/host-panels.module.css";

export const metadata: Metadata = {
  title: "Event host panel | Collexus",
  description: "Track your event requests and organizer access.",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

function formatDate(value: string | undefined) {
  if (!value) return "Date to be announced";
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })
    .format(new Date(`${value}T00:00:00Z`));
}

function statusClass(status: string) {
  if (status === "approved") return `${styles.status} ${styles.statusApproved}`;
  if (status === "rejected") return `${styles.status} ${styles.statusRejected}`;
  return `${styles.status} ${styles.statusPending}`;
}

export default async function EventHostPanelPage() {
  if (!process.env.DATABASE_URL) {
    return <main className={styles.page}><div className={styles.container}><section className={styles.empty}><strong>Event records are not connected yet</strong><p>The event panel needs the server database connection and the host access migration. Configure those before loading private requests.</p><Link className={styles.actionLink} href="/">Return to Collexus</Link></section></div></main>;
  }

  let user;
  try {
    ({ user } = await requireRole("event_organizer"));
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) redirect(`/login/?next=${encodeURIComponent("/event-panel/")}`);
    if (error instanceof ApiError && error.status === 403) {
      return <main className={styles.page}><div className={styles.container}><section className={styles.empty}><strong>Event host access is not active</strong><p>Submit an event for review. Collexus adds this panel to your profile after an administrator approves your request.</p><Link className={styles.actionLink} href="/host-event/">Request event access</Link></section></div></main>;
    }
    throw error;
  }

  const rows = await getPrisma().eventSubmission.findMany({
    where: { organizerId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: { id: true, submission: true, status: true, reviewNote: true, createdAt: true, reviewedAt: true },
  });
  const submissions = rows.map((row) => ({ ...row, details: eventSubmissionSchema.safeParse(row.submission) }));

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <div className={styles.topbar}><Link className={styles.brand} href="/">COLLEXUS · EVENT HOST</Link><nav aria-label="Event host navigation"><Link href="/profile/">Profile</Link><Link href="/host-event/">Submit an event</Link></nav></div>
        <section className={styles.hero}>
          <div><p className={styles.eyebrow}>ORGANIZER WORKSPACE</p><h1>Your event requests</h1><p>Review your request status and administrator notes. Approval confirms organizer access; events appear in the public catalog only after a separate publishing review.</p></div>
          <span className={styles.heroIcon} aria-hidden="true"><CalendarDays size={28} /></span>
        </section>
        <section className={styles.section} aria-labelledby="requests-heading">
          <div className={styles.sectionHead}><div><h2 id="requests-heading">Submitted events</h2><p>Only requests submitted by this signed-in account are shown.</p></div><span className={styles.count}>{submissions.length} requests</span></div>
          {submissions.length === 0 ? <div className={styles.empty}><strong>No event requests yet</strong><p>Start a request to share an event with the Collexus community. An administrator will review it before access is enabled.</p><Link className={styles.actionLink} href="/host-event/">Submit an event <ExternalLink size={14} /></Link></div> : (
            <div className={styles.list}>
              {submissions.map((row) => {
                const details = row.details.success ? row.details.data : null;
                const event = details?.event;
                return <article className={styles.card} key={row.id}>
                  <div className={styles.cardTop}><span className={statusClass(row.status)}>{row.status.replaceAll("_", " ")}</span><time dateTime={row.createdAt.toISOString()}>Submitted {new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(row.createdAt)}</time></div>
                  <h3>{event?.name ?? "Event request"}</h3>
                  <p className={styles.meta}><span>{event?.category ?? "Event"}</span><span><CalendarDays size={13} aria-hidden="true" /> {formatDate(event?.startDate)}{event?.endDate && event.endDate !== event.startDate ? ` – ${formatDate(event.endDate)}` : ""}</span><span><MapPin size={13} aria-hidden="true" /> {event?.venue ?? "Venue pending"}</span></p>
                  {event?.description && <p className={styles.description}>{event.description}</p>}
                  {row.reviewNote && <p className={styles.footnote}><strong>Administrator note:</strong> {row.reviewNote}</p>}
                  {row.status === "approved" && <p className={`${styles.footnote} ${styles.noticeSuccess}`}>Your organizer access is approved. The public event listing still requires catalog publication.</p>}
                </article>;
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
