import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, ExternalLink, FileCheck2, Radio } from "lucide-react";
import { reviewEventSubmission } from "@/app/admin/actions";
import { AdminPanelAccessMessage, AdminPanelShell } from "@/app/admin/admin-panel-shell";
import { getAdminEventPanelData, type AdminEventSubmissionStatus } from "@/lib/admin/panel-data";
import { requireAdminPanel } from "@/lib/admin/page-auth";
import adminStyles from "../admin.module.css";
import styles from "../admin-panels.module.css";

export const metadata: Metadata = {
  title: "Event management | Collexus Admin",
  description: "Review organizer event requests and view verified RCEE event records.",
  robots: { index: false, follow: false },
};

type PageProps = { searchParams: Promise<{ page?: string; status?: string; error?: string; notice?: string }> };

const messages: Record<string, { tone: "error" | "success"; text: string }> = {
  "invalid-review": { tone: "error", text: "The event review could not be validated. Refresh the request and try again." },
  "review-failed": { tone: "error", text: "The review was not saved. Refresh and try again." },
  "review-saved": { tone: "success", text: "The event request review was saved. Approval grants Event panel access to the organizer." },
};

function parsePage(value?: string) {
  const page = Number(value);
  return Number.isSafeInteger(page) && page > 0 ? page : 1;
}

function safeStatus(value?: string): AdminEventSubmissionStatus {
  return value === "approved" || value === "rejected" ? value : "pending_review";
}

function formatDate(start: string | null, end: string | null) {
  if (!start) return "Dates not provided";
  const render = (date: string) => new Intl.DateTimeFormat("en-IN", {
    day: "numeric", month: "short", year: "numeric", timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
  return !end || end === start ? render(start) : `${render(start)} – ${render(end)}`;
}

function paginationHref(page: number, status: AdminEventSubmissionStatus) {
  const query = new URLSearchParams({ page: String(page), status });
  return `/admin/events/?${query.toString()}#event-requests`;
}

export default async function AdminEventsPage({ searchParams }: PageProps) {
  const user = await requireAdminPanel("/admin/events/");
  if (!user) return <AdminPanelAccessMessage title="Administrator access required">This section is restricted to accounts with an explicitly assigned administrator role.</AdminPanelAccessMessage>;
  if (!process.env.DATABASE_URL) return <AdminPanelAccessMessage title="Database connection needs setup">Set the server-side database connection and apply the admin-console migrations before reviewing event requests.</AdminPanelAccessMessage>;

  const params = await searchParams;
  const status = safeStatus(params.status);
  let data: Awaited<ReturnType<typeof getAdminEventPanelData>>;
  try {
    data = await getAdminEventPanelData(parsePage(params.page), status);
  } catch (error) {
    console.error(JSON.stringify({ level: "error", message: "Admin event panel could not load records", errorName: error instanceof Error ? error.name : "UnknownError" }));
    return <AdminPanelAccessMessage title="Event records are unavailable">The event panel could not load its current records. Check the database configuration and applied migrations.</AdminPanelAccessMessage>;
  }

  const message = params.notice ? messages[params.notice] : params.error ? messages[params.error] : undefined;
  const previous = data.pagination.page > 1 ? paginationHref(data.pagination.page - 1, status) : null;
  const next = data.pagination.page < data.pagination.totalPages ? paginationHref(data.pagination.page + 1, status) : null;

  return (
    <AdminPanelShell active="events" email={user.email ?? "administrator"}>
      {message && <p className={`${adminStyles.notice} ${message.tone === "error" ? adminStyles.noticeError : adminStyles.noticeSuccess}`} role={message.tone === "error" ? "alert" : "status"}>{message.text}</p>}

      <section className={adminStyles.hero}>
        <div>
          <p className={adminStyles.eyebrow}>EVENT OPERATIONS</p>
          <h1>Event management</h1>
          <p>Review organizer requests and reference the verified RCEE event catalog.</p>
        </div>
        <span className={adminStyles.heroMark}><CalendarDays size={30} aria-hidden="true" /></span>
      </section>

      <section className={adminStyles.metrics} aria-label="Event request totals">
        <article className={adminStyles.metricCard}><span className={`${adminStyles.metricIcon} ${adminStyles.iconAmber}`}><Radio size={17} aria-hidden="true" /></span><p>Needs review</p><strong>{data.counts.pending.toLocaleString("en-IN")}</strong><small>Organizer requests</small></article>
        <article className={adminStyles.metricCard}><span className={`${adminStyles.metricIcon} ${adminStyles.iconBlue}`}><FileCheck2 size={17} aria-hidden="true" /></span><p>Approved</p><strong>{data.counts.approved.toLocaleString("en-IN")}</strong><small>Reviewed requests</small></article>
        <article className={adminStyles.metricCard}><span className={`${adminStyles.metricIcon} ${adminStyles.iconViolet}`}><CalendarDays size={17} aria-hidden="true" /></span><p>Verified catalog</p><strong>{data.eventCatalog.length.toLocaleString("en-IN")}</strong><small>Official RCEE records</small></article>
      </section>

      <section className={adminStyles.section} id="event-requests">
        <div className={adminStyles.sectionHeading}>
          <div><p className={adminStyles.eyebrow}>ORGANIZER WORKFLOW</p><h2>Event requests</h2><p>Approval grants the organizer access to their Event panel. It does not publish into the official RCEE catalog.</p></div>
          <span className={adminStyles.countBadge}>{data.pagination.totalItems.toLocaleString("en-IN")} shown</span>
        </div>

        <nav className={styles.filterTabs} aria-label="Filter event requests">
          {([
            ["pending_review", "Needs review", data.counts.pending],
            ["approved", "Approved", data.counts.approved],
            ["rejected", "Declined", data.counts.rejected],
          ] as const).map(([value, label, count]) => (
            <Link aria-current={status === value ? "page" : undefined} href={`/admin/events/?status=${value}#event-requests`} key={value}>{label}<span>{count}</span></Link>
          ))}
        </nav>

        {data.submissions.length === 0 ? (
          <div className={adminStyles.emptyState}><span><FileCheck2 size={22} aria-hidden="true" /></span><div><strong>{status === "pending_review" ? "No requests need review" : `No ${status === "approved" ? "approved" : "declined"} requests yet`}</strong><p>New organizer requests will appear here after they are submitted.</p></div></div>
        ) : (
          <div className={adminStyles.submissionList}>
            {data.submissions.map((submission) => (
              <article className={adminStyles.submissionCard} key={submission.id}>
                <div className={adminStyles.submissionTop}>
                  <span className={submission.status === "pending_review" ? adminStyles.pendingPill : adminStyles.statusPill}>{submission.status === "pending_review" ? <><span /> Needs review</> : submission.status}</span>
                  <time dateTime={submission.createdAt.toISOString()}>Submitted {new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(submission.createdAt)}</time>
                </div>
                <div className={adminStyles.submissionBody}>
                  <div>
                    <h3>{submission.eventName}</h3>
                    <p className={adminStyles.submissionMeta}>{submission.category} · {formatDate(submission.startDate, submission.endDate)} · {submission.venue || "Venue not provided"}</p>
                    <p className={styles.submissionDescription}>{submission.description}</p>
                    <div className={styles.submissionDetails}>
                      <span><strong>Organizer:</strong> {submission.organizerName}</span>
                      <span><strong>Institution:</strong> {submission.organizerInstitution || "Not provided"}</span>
                      <span><strong>Email:</strong> {submission.organizerEmail || "Not provided"}</span>
                      <span><strong>Fee:</strong> {submission.pricing === "paid" ? `₹${submission.price ?? 0}` : "Free"}</span>
                    </div>
                  </div>
                  {submission.status === "pending_review" ? (
                    <form action={reviewEventSubmission} className={styles.reviewActions}>
                      <input name="submissionId" type="hidden" value={submission.id} />
                      <input name="returnTo" type="hidden" value="/admin/events/" />
                      <label className={styles.field}>
                        Review note
                        <textarea maxLength={1200} name="note" placeholder="Record a short reason or follow-up." />
                      </label>
                      <div className={styles.decisionButtons}>
                        <button name="decision" type="submit" value="approved">Approve request</button>
                        <button name="decision" type="submit" value="rejected">Decline request</button>
                      </div>
                    </form>
                  ) : (
                    <div className={adminStyles.reviewedRow}><span className={`${adminStyles.statusPill} ${submission.status === "approved" ? adminStyles.statusApproved : adminStyles.statusRejected}`}>{submission.status}</span><span>{submission.reviewNote || "No review note"}</span>{submission.reviewedAt && <time dateTime={submission.reviewedAt.toISOString()}>{new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(submission.reviewedAt)}</time>}</div>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}

        {data.pagination.totalPages > 1 && <nav className={adminStyles.pagination} aria-label="Event request pages"><span>Page {data.pagination.page} of {data.pagination.totalPages} · {data.pagination.totalItems} requests</span><div>{previous ? <Link href={previous}>Previous</Link> : <span aria-disabled="true">Previous</span>}{next ? <Link href={next}>Next</Link> : <span aria-disabled="true">Next</span>}</div></nav>}
      </section>

      <section className={adminStyles.section}>
        <div className={adminStyles.sectionHeading}>
          <div><p className={adminStyles.eyebrow}>VERIFIED SOURCE CATALOG</p><h2>RCEE event records</h2><p>These public listings are based on official source pages and are read-only in the current data model.</p></div>
          <span className={adminStyles.countBadge}>{data.eventCatalog.length} records</span>
        </div>
        <div className={styles.catalogList}>
          {data.eventCatalog.map((event) => (
            <article className={styles.catalogRow} key={event.slug}>
              <div><strong>{event.title}</strong><small>{event.dateLabel} · {event.venue}</small></div>
              <a href={event.source} rel="noreferrer" target="_blank">Official source <ExternalLink size={13} aria-hidden="true" /></a>
            </article>
          ))}
        </div>
        <p className={styles.formHint}>When a database-backed event publishing workflow is added, approved organizer requests can be connected to it without modifying these verified RCEE records.</p>
      </section>
    </AdminPanelShell>
  );
}
