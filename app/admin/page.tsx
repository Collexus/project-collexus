import type { Metadata } from "next";
import type { ReactNode } from "react";
import type { User } from "@supabase/supabase-js";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  Activity, ArrowDownRight, ArrowLeft, ArrowUpRight, BadgeCheck,
  ClipboardCheck, FileClock, Landmark, ShieldCheck, UsersRound,
} from "lucide-react";
import { changeAccountRole, changeStaffEventAssignment, reviewEventSubmission } from "@/app/admin/actions";
import { formatAdminDate, getAdminDashboardData, roleLabels } from "@/lib/admin/data";
import { adminManageableRoles } from "@/lib/admin/schemas";
import { requireRole } from "@/lib/auth";
import { ApiError } from "@/lib/backend/errors";
import { events } from "@/data/events";
import styles from "./admin.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin workspace",
  description: "Review event submissions and manage Collexus account roles.",
  robots: { index: false, follow: false },
};

type AdminPageProps = {
  searchParams: Promise<{ notice?: string; error?: string; submissionPage?: string; accountPage?: string; auditPage?: string }>;
};

type ListSection = "submissions" | "accounts" | "audit";
type PageState = Record<ListSection, number>;
type PageInfo = { page: number; totalPages: number; totalItems: number };

const messages: Record<string, { tone: "success" | "error"; text: string }> = {
  "review-saved": { tone: "success", text: "The submission review was saved and added to the audit history." },
  "role-updated": { tone: "success", text: "The role assignment was updated and recorded." },
  "invalid-review": { tone: "error", text: "That review request was incomplete. Refresh and try again." },
  "review-failed": { tone: "error", text: "The review could not be saved. It may have been updated by another administrator." },
  "invalid-role": { tone: "error", text: "Choose a valid account and role, then try again." },
  "role-change-failed": { tone: "error", text: "The role change could not be saved. Check the current assignment and try again." },
  "self-admin-revoke": { tone: "error", text: "You can’t revoke your own administrator role. Ask another administrator to do that." },
  "last-admin": { tone: "error", text: "The last active administrator role can’t be revoked." },
  "role-not-active": { tone: "error", text: "That role is not currently active for this account." },
  "invalid-staff-assignment": { tone: "error", text: "Choose a valid staff account and event, then try again." },
  "staff-role-required": { tone: "error", text: "Assign the Event staff role before assigning event access." },
  "staff-assignment-not-active": { tone: "error", text: "That event assignment is not currently active." },
  "staff-assignment-failed": { tone: "error", text: "The event staff assignment could not be saved. Refresh and try again." },
  "staff-assignment-updated": { tone: "success", text: "The event staff assignment was updated and recorded." },
};

function AdminAccessMessage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main id="main-content" tabIndex={-1} className={styles.accessPage}>
      <section className={styles.accessCard}>
        <span className={styles.brandMark}><ShieldCheck size={22} aria-hidden="true" /></span>
        <p className={styles.eyebrow}>COLLEXUS ADMIN</p>
        <h1>{title}</h1>
        <p>{children}</p>
        <Link className={styles.backHome} href="/"><ArrowLeft size={16} aria-hidden="true" /> Back to Collexus</Link>
      </section>
    </main>
  );
}

function shortId(value: string) {
  return value.slice(0, 8).toUpperCase();
}

function parsePage(value?: string) {
  const page = Number(value);
  return Number.isSafeInteger(page) && page > 0 ? page : 1;
}

function paginationHref(section: ListSection, targetPage: number, pages: PageState) {
  const next = { ...pages, [section]: targetPage };
  const query = new URLSearchParams({
    submissionPage: String(next.submissions),
    accountPage: String(next.accounts),
    auditPage: String(next.audit),
  });
  const anchor = section === "submissions" ? "event-review" : section === "accounts" ? "accounts" : "audit-log";
  return `/admin/?${query.toString()}#${anchor}`;
}

function Pagination({ section, info, pages }: { section: ListSection; info: PageInfo; pages: PageState }) {
  if (info.totalPages < 2) return null;
  const previous = info.page > 1 ? paginationHref(section, info.page - 1, pages) : null;
  const next = info.page < info.totalPages ? paginationHref(section, info.page + 1, pages) : null;
  return (
    <nav className={styles.pagination} aria-label={`${section} list pages`}>
      <span>Page {info.page} of {info.totalPages} <i /> {info.totalItems.toLocaleString("en-IN")} total</span>
      <div>
        {previous ? <Link href={previous}>Previous</Link> : <span aria-disabled="true">Previous</span>}
        {next ? <Link href={next}>Next</Link> : <span aria-disabled="true">Next</span>}
      </div>
    </nav>
  );
}

function formatSubmissionDates(start: string | null, end: string | null) {
  if (!start) return "Dates not provided";
  const date = (value: string) => new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));
  if (!end || end === start) return date(start);
  return `${date(start)} – ${date(end)}`;
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const hasSupabase = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  );
  if (!hasSupabase) {
    return <AdminAccessMessage title="Authentication needs setup">Configure Supabase Auth before an administrator can sign in to this workspace.</AdminAccessMessage>;
  }

  let adminUser: User;
  try {
    ({ user: adminUser } = await requireRole("admin"));
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) redirect("/admin/login/?next=%2Fadmin%2F");
    if (error instanceof ApiError && error.code === "MFA_REQUIRED") redirect("/admin/mfa/?next=%2Fadmin%2F");
    if (error instanceof ApiError && error.status === 403) {
      return <AdminAccessMessage title="Administrator access required">This workspace is restricted to accounts with an explicitly assigned administrator role.</AdminAccessMessage>;
    }
    return <AdminAccessMessage title="The admin workspace is unavailable">Check the server authentication and database configuration, then reload this page.</AdminAccessMessage>;
  }

  if (!process.env.DATABASE_URL) {
    return <AdminAccessMessage title="Database connection needs setup">Set the server-side DATABASE_URL and apply the admin-console migrations before using account and review tools.</AdminAccessMessage>;
  }

  const params = await searchParams;
  let pages: PageState = {
    submissions: parsePage(params.submissionPage),
    accounts: parsePage(params.accountPage),
    audit: parsePage(params.auditPage),
  };

  let data: Awaited<ReturnType<typeof getAdminDashboardData>>;
  try {
    data = await getAdminDashboardData(pages);
  } catch (error) {
    console.error(JSON.stringify({ level: "error", message: "Admin workspace data could not be loaded", errorName: error instanceof Error ? error.name : "UnknownError" }));
    return <AdminAccessMessage title="The admin workspace is unavailable">The database could not load current admin records. Check the server configuration and applied migrations.</AdminAccessMessage>;
  }
  pages = {
    submissions: data.pagination.submissions.page,
    accounts: data.pagination.accounts.page,
    audit: data.pagination.audit.page,
  };

  const message = params.notice ? messages[params.notice] : params.error ? messages[params.error] : undefined;
  const activeAdminCount = data.metrics.activeAdmins;

  return (
    <main id="main-content" tabIndex={-1} className={styles.dashboard}>
      <div className={styles.shell}>
        <aside className={styles.sidebar} aria-label="Admin workspace navigation">
          <Link className={styles.brand} href="/" aria-label="Collexus home">
            <span className={styles.brandIcon}><Landmark size={19} aria-hidden="true" /></span>
            <span><strong>COLLEXUS</strong><small>ADMIN WORKSPACE</small></span>
          </Link>
          <p className={styles.navLabel}>WORKSPACE</p>
          <nav className={styles.nav}>
            <a href="#overview" className={styles.navActive}><Activity size={17} aria-hidden="true" /> Overview</a>
            <a href="#event-review"><ClipboardCheck size={17} aria-hidden="true" /> Event review <span>{data.metrics.pending}</span></a>
            <a href="#accounts"><UsersRound size={17} aria-hidden="true" /> Accounts &amp; roles</a>
            <a href="#audit-log"><FileClock size={17} aria-hidden="true" /> Audit history</a>
          </nav>
          <div className={styles.sidebarNote}>
            <ShieldCheck size={17} aria-hidden="true" />
            <p>Admin actions are checked on the server and written to the audit history.</p>
          </div>
          <Link className={styles.backLink} href="/"><ArrowLeft size={16} aria-hidden="true" /> View public site</Link>
        </aside>

        <section className={styles.mainColumn}>
          <header className={styles.topbar}>
            <div><span className={styles.breadcrumb}>Workspace <span>/</span> Overview</span><p>Signed in as <strong>{adminUser.email ?? "administrator"}</strong></p></div>
            <div className={styles.secureBadge}><ShieldCheck size={16} aria-hidden="true" /> Admin session</div>
          </header>

          <div className={styles.content}>
            {message && <p className={`${styles.notice} ${message.tone === "error" ? styles.noticeError : styles.noticeSuccess}`} role={message.tone === "error" ? "alert" : "status"}>{message.text}</p>}

            <section id="overview" className={styles.hero}>
              <div>
                <p className={styles.eyebrow}>COLLEXUS CONTROL CENTER</p>
                <h1>Good to see you, {adminUser.email?.split("@")[0] || "administrator"}.</h1>
                <p>Review campus event requests, manage account roles and event staff access, and keep a clear record of administrative changes.</p>
              </div>
              <div className={styles.heroMark} aria-hidden="true"><Landmark size={31} /></div>
            </section>

            <section className={styles.metrics} aria-label="Platform overview">
              <article className={styles.metricCard}><span className={`${styles.metricIcon} ${styles.iconTeal}`}><UsersRound size={18} aria-hidden="true" /></span><p>Accounts</p><strong>{data.metrics.profiles.toLocaleString("en-IN")}</strong><small>Profiles in Collexus</small></article>
              <article className={styles.metricCard}><span className={`${styles.metricIcon} ${styles.iconAmber}`}><ClipboardCheck size={18} aria-hidden="true" /></span><p>Awaiting review</p><strong>{data.metrics.pending.toLocaleString("en-IN")}</strong><small>Event submissions</small></article>
              <article className={styles.metricCard}><span className={`${styles.metricIcon} ${styles.iconBlue}`}><BadgeCheck size={18} aria-hidden="true" /></span><p>Approved</p><strong>{data.metrics.approved.toLocaleString("en-IN")}</strong><small>Reviewed submissions</small></article>
              <article className={styles.metricCard}><span className={`${styles.metricIcon} ${styles.iconViolet}`}><ShieldCheck size={18} aria-hidden="true" /></span><p>Admin accounts</p><strong>{activeAdminCount.toLocaleString("en-IN")}</strong><small>Active assignments</small></article>
            </section>

            <section id="event-review" className={styles.section}>
              <div className={styles.sectionHeading}>
                <div><p className={styles.eyebrow}>ORGANIZER WORKFLOW</p><h2>Event submissions</h2><p>Check the organizer and event details before saving a review decision.</p></div>
                <span className={styles.countBadge}>{data.metrics.pending} pending</span>
              </div>

              {data.submissions.length === 0 && data.pagination.submissions.page === 1 ? (
                <div className={styles.emptyState}><span><BadgeCheck size={22} aria-hidden="true" /></span><div><strong>You’re up to date</strong><p>There are no event submissions waiting for review.</p></div></div>
              ) : (
                <div className={styles.submissionList}>
                  {data.submissions.map((submission) => (
                    <article className={styles.submissionCard} key={submission.id}>
                      <div className={styles.submissionTop}>
                        <span className={styles.pendingPill}><span /> Needs review</span>
                        <time dateTime={submission.createdAt.toISOString()}>Submitted {formatAdminDate(submission.createdAt)}</time>
                      </div>
                      <div className={styles.submissionBody}>
                        <div>
                          <h3>{submission.eventName}</h3>
                          <p className={styles.submissionMeta}>{submission.category} <span>·</span> {formatSubmissionDates(submission.startDate, submission.endDate)} <span>·</span> {submission.pricing === "paid" ? `₹${submission.price}` : submission.pricing === "free" ? "Free" : "Pricing not available"}</p>
                          <p className={styles.submissionDescription}>{submission.description}</p>
                          <details className={styles.organizerDetails}>
                            <summary>Organizer details</summary>
                            <p><strong>{submission.organizerName}</strong> · {submission.organizerInstitution}</p>
                            {submission.organizerEmail && <p><a href={`mailto:${submission.organizerEmail}`}>{submission.organizerEmail}</a></p>}
                            {submission.venue && <p>Venue: {submission.venue}</p>}
                            <p>Submission ID: {shortId(submission.id)}</p>
                          </details>
                        </div>
                        <form action={reviewEventSubmission} className={styles.reviewForm}>
                          <input type="hidden" name="submissionId" value={submission.id} />
                          <label htmlFor={`review-note-${submission.id}`}>Review note <span>Optional</span></label>
                          <textarea id={`review-note-${submission.id}`} name="note" maxLength={1200} placeholder="Add context for the organizer" />
                          <div className={styles.reviewActions}>
                            <button className={styles.approveButton} type="submit" name="decision" value="approved"><BadgeCheck size={16} aria-hidden="true" /> Approve</button>
                            <button className={styles.rejectButton} type="submit" name="decision" value="rejected"><ArrowDownRight size={16} aria-hidden="true" /> Decline</button>
                          </div>
                        </form>
                      </div>
                    </article>
                  ))}
                </div>
              )}

              {data.submissions.length === 0 && data.pagination.submissions.page > 1 && <div className={styles.emptyState}><span><BadgeCheck size={22} aria-hidden="true" /></span><div><strong>No more pending submissions</strong><p>Return to an earlier page to review the remaining requests.</p></div></div>}
              <Pagination section="submissions" info={data.pagination.submissions} pages={pages} />

              <p className={styles.scopeNote}>Approval records the moderation decision. Public RCEE event records continue to use the verified source content in the existing catalog.</p>

              {data.reviewed.length > 0 && <div className={styles.recentReviews}>
                <h3>Recently reviewed</h3>
                {data.reviewed.map((submission) => <div className={styles.reviewedRow} key={submission.id}><span className={`${styles.statusPill} ${submission.status === "approved" ? styles.statusApproved : styles.statusRejected}`}>{submission.status === "approved" ? "Approved" : "Declined"}</span><strong>{submission.eventName}</strong><time dateTime={(submission.reviewedAt ?? submission.createdAt).toISOString()}>{formatAdminDate(submission.reviewedAt ?? submission.createdAt)}</time></div>)}
              </div>}
            </section>

            <section id="accounts" className={styles.section}>
              <div className={styles.sectionHeading}>
                <div><p className={styles.eyebrow}>ACCESS CONTROL</p><h2>Accounts &amp; roles</h2><p>Grant explicit platform roles. Changes apply to server-side permissions and are audited.</p></div>
                <span className={styles.countBadge}>{data.pagination.accounts.totalItems.toLocaleString("en-IN")} accounts</span>
              </div>
              <div className={styles.roleLegend}>
                {adminManageableRoles.map((role) => <span className={styles.roleChip} key={role}>{roleLabels[role]}</span>)}
              </div>
              <div className={styles.accountList}>
                {data.accounts.length === 0 ? <div className={styles.emptyState}><span><UsersRound size={22} aria-hidden="true" /></span><div><strong>No profiles yet</strong><p>Accounts appear here after they create a Collexus profile.</p></div></div> : data.accounts.map((account) => (
                  <article className={styles.accountRow} key={account.id}>
                    <div className={styles.accountIdentity}>
                      <span className={styles.accountAvatar} aria-hidden="true">{account.name.slice(0, 1).toUpperCase()}</span>
                      <div><strong>{account.name}</strong><p>{account.accountType} <span>·</span> ID {shortId(account.id)} <span>·</span> Joined {formatAdminDate(account.createdAt)}</p></div>
                    </div>
                    <div className={styles.accountRoles} aria-label={`Roles for ${account.name}`}>
                      {account.roles.map((role) => <span className={role === "admin" ? styles.adminRole : styles.roleChip} key={role}>{roleLabels[role] ?? role}</span>)}
                    </div>
                    <form action={changeAccountRole} className={styles.roleForm}>
                      <input type="hidden" name="userId" value={account.id} />
                      <label className={styles.srOnly} htmlFor={`role-${account.id}`}>Role for {account.name}</label>
                      <select id={`role-${account.id}`} name="role" defaultValue={adminManageableRoles.find((role) => account.roles.includes(role)) ?? ""}>
                        <option value="" disabled>Choose role</option>
                        {adminManageableRoles.map((role) => <option value={role} key={role}>{roleLabels[role]}</option>)}
                      </select>
                      <button type="submit" name="operation" value="assign">Assign</button>
                      <button className={styles.revokeButton} type="submit" name="operation" value="revoke">Revoke</button>
                    </form>
                    {account.roles.includes("staff") && <div className={styles.staffAssignments}>
                      <div><strong>Event access</strong><p>Staff can access only the events assigned here.</p></div>
                      <form action={changeStaffEventAssignment} className={styles.staffAssignForm}>
                        <input type="hidden" name="userId" value={account.id} />
                        <label className={styles.srOnly} htmlFor={`event-${account.id}`}>Event for {account.name}</label>
                        <select id={`event-${account.id}`} name="eventSlug" defaultValue="">
                          <option value="" disabled>Choose event</option>
                          {events.filter((event) => !account.staffEvents.some((assignment) => assignment.slug === event.slug)).map((event) => <option value={event.slug} key={event.slug}>{event.title}</option>)}
                        </select>
                        <button type="submit" name="operation" value="assign" disabled={account.staffEvents.length >= events.length}>Assign event</button>
                      </form>
                      {account.staffEvents.length > 0 ? <ul className={styles.staffAssignmentList} aria-label={`Assigned events for ${account.name}`}>
                        {account.staffEvents.map((assignment) => <li key={assignment.id}>
                          <span><strong>{assignment.title}</strong><small>{assignment.dateLabel}</small></span>
                          <form action={changeStaffEventAssignment}>
                            <input type="hidden" name="userId" value={account.id} />
                            <input type="hidden" name="eventSlug" value={assignment.slug} />
                            <button className={styles.revokeButton} type="submit" name="operation" value="revoke">Revoke access</button>
                          </form>
                        </li>)}
                      </ul> : <p className={styles.noStaffAssignments}>No event access assigned.</p>}
                    </div>}
                  </article>
                ))}
              </div>
              <Pagination section="accounts" info={data.pagination.accounts} pages={pages} />
              <p className={styles.scopeNote}>Student access is the default. Role changes cannot revoke your own administrator role or remove the last active administrator.</p>
            </section>

            <section id="audit-log" className={styles.section}>
              <div className={styles.sectionHeading}>
                <div><p className={styles.eyebrow}>ACCOUNTABILITY</p><h2>Audit history</h2><p>Recent event review and access changes.</p></div>
                <span className={styles.countBadge}>{data.pagination.audit.totalItems.toLocaleString("en-IN")} entries</span>
              </div>
              <div className={styles.auditList}>
                {data.audit.length === 0 ? <div className={styles.emptyState}><span><FileClock size={22} aria-hidden="true" /></span><div><strong>No admin actions yet</strong><p>Role changes and event review decisions will appear here.</p></div></div> : data.audit.map((entry) => (
                  <article className={styles.auditRow} key={entry.id}>
                    <span className={styles.auditIcon}><Activity size={16} aria-hidden="true" /></span>
                    <div><strong>{entry.action.replaceAll("_", " ").replaceAll(".", " · ")}</strong><p>{entry.actorName} <span>·</span> {entry.resourceType.replaceAll("_", " ")}{entry.resourceId ? ` · ${shortId(entry.resourceId)}` : ""}</p></div>
                    <time dateTime={entry.createdAt.toISOString()}>{formatAdminDate(entry.createdAt)}</time>
                  </article>
                ))}
              </div>
              <Pagination section="audit" info={data.pagination.audit} pages={pages} />
            </section>

            <section className={styles.catalogFootnote} aria-label="Published event catalog">
              <div><span className={styles.metricIcon}><Landmark size={17} aria-hidden="true" /></span><div><strong>{events.length} verified RCEE event records</strong><p>The current public catalog is maintained against official source pages. Admin changes to that catalog are not enabled in this data model.</p></div></div>
              <Link href="/#featured-events">View catalog <ArrowUpRight size={15} aria-hidden="true" /></Link>
            </section>

            <footer className={styles.footer}><span>Collexus administration</span><span>Access is checked on each server action.</span></footer>
          </div>
        </section>
      </div>
    </main>
  );
}
