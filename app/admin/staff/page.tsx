import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CalendarDays, Search, ShieldCheck, UserCheck, UserRoundPlus, UsersRound } from "lucide-react";
import { changeAccountRole, changeStaffEventAssignment } from "@/app/admin/actions";
import { AdminPanelAccessMessage, AdminPanelShell } from "@/app/admin/admin-panel-shell";
import { getAdminStaffPanelData } from "@/lib/admin/panel-data";
import { requireAdminPanel } from "@/lib/admin/page-auth";
import adminStyles from "../admin.module.css";
import styles from "../admin-panels.module.css";

export const metadata: Metadata = {
  title: "Staff management | Collexus Admin",
  description: "Assign staff access to Collexus campus events.",
  robots: { index: false, follow: false },
};

type PageProps = { searchParams: Promise<{ page?: string; q?: string; error?: string; notice?: string }> };

const messages: Record<string, { tone: "error" | "success"; text: string }> = {
  "invalid-role": { tone: "error", text: "Choose a valid account and try assigning the staff role again." },
  "role-change-failed": { tone: "error", text: "The staff role could not be saved. Refresh and try again." },
  "role-updated": { tone: "success", text: "The staff role was updated. Changes are recorded in the audit history." },
  "invalid-staff-assignment": { tone: "error", text: "Choose a valid staff account and event, then try again." },
  "staff-role-required": { tone: "error", text: "Assign the staff role before granting event access." },
  "staff-assignment-not-active": { tone: "error", text: "That event assignment is not currently active." },
  "staff-assignment-failed": { tone: "error", text: "The event assignment could not be saved. Refresh and try again." },
  "staff-assignment-updated": { tone: "success", text: "The event assignment was updated and added to the audit history." },
  "self-admin-revoke": { tone: "error", text: "You can’t revoke your own administrator role." },
  "last-admin": { tone: "error", text: "The last active administrator role can’t be revoked." },
  "role-not-active": { tone: "error", text: "That role is not currently active for this account." },
};

function parsePage(value?: string) {
  const page = Number(value);
  return Number.isSafeInteger(page) && page > 0 ? page : 1;
}

function paginationHref(page: number, search: string) {
  const query = new URLSearchParams({ page: String(page) });
  if (search) query.set("q", search);
  return `/admin/staff/?${query.toString()}#staff-list`;
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "S";
}

export default async function AdminStaffPage({ searchParams }: PageProps) {
  const user = await requireAdminPanel("/admin/staff/");
  if (!user) return <AdminPanelAccessMessage title="Administrator access required">This section is restricted to accounts with an explicitly assigned administrator role.</AdminPanelAccessMessage>;
  if (!process.env.DATABASE_URL) return <AdminPanelAccessMessage title="Database connection needs setup">Set the server-side database connection and apply the admin-console migrations before managing staff access.</AdminPanelAccessMessage>;

  const params = await searchParams;
  let data: Awaited<ReturnType<typeof getAdminStaffPanelData>>;
  try {
    data = await getAdminStaffPanelData(parsePage(params.page), params.q ?? "");
  } catch (error) {
    console.error(JSON.stringify({ level: "error", message: "Admin staff panel could not load records", errorName: error instanceof Error ? error.name : "UnknownError" }));
    return <AdminPanelAccessMessage title="Staff records are unavailable">The staff panel could not load its current records. Check the database configuration and applied migrations.</AdminPanelAccessMessage>;
  }

  const message = params.notice ? messages[params.notice] : params.error ? messages[params.error] : undefined;
  const previous = data.pagination.page > 1 ? paginationHref(data.pagination.page - 1, data.search) : null;
  const next = data.pagination.page < data.pagination.totalPages ? paginationHref(data.pagination.page + 1, data.search) : null;

  return (
    <AdminPanelShell active="staff" email={user.email ?? "administrator"}>
      {message && <p className={`${adminStyles.notice} ${message.tone === "error" ? adminStyles.noticeError : adminStyles.noticeSuccess}`} role={message.tone === "error" ? "alert" : "status"}>{message.text}</p>}

      <section className={adminStyles.hero}>
        <div><p className={adminStyles.eyebrow}>ACCESS OPERATIONS</p><h1>Staff management</h1><p>Grant the event staff role, assign event access, and revoke access when operations end.</p></div>
        <span className={adminStyles.heroMark}><UsersRound size={30} aria-hidden="true" /></span>
      </section>

      <section className={adminStyles.metrics} aria-label="Staff access totals">
        <article className={adminStyles.metricCard}><span className={`${adminStyles.metricIcon} ${adminStyles.iconTeal}`}><UserCheck size={17} aria-hidden="true" /></span><p>Active staff</p><strong>{data.counts.activeStaff.toLocaleString("en-IN")}</strong><small>Explicit role assignments</small></article>
        <article className={adminStyles.metricCard}><span className={`${adminStyles.metricIcon} ${adminStyles.iconBlue}`}><CalendarDays size={17} aria-hidden="true" /></span><p>Event assignments</p><strong>{data.counts.activeEventAssignments.toLocaleString("en-IN")}</strong><small>Current event access grants</small></article>
        <article className={adminStyles.metricCard}><span className={`${adminStyles.metricIcon} ${adminStyles.iconViolet}`}><ShieldCheck size={17} aria-hidden="true" /></span><p>Access control</p><strong>Server checked</strong><small>Revoked grants stop access</small></article>
      </section>

      <section className={adminStyles.section}>
        <div className={adminStyles.sectionHeading}>
          <div><p className={adminStyles.eyebrow}>ADD STAFF</p><h2>Grant event staff access</h2><p>Search existing Collexus profiles. Role grants are audited and never inferred from email.</p></div>
        </div>
        <form action="/admin/staff/" className={styles.searchForm} method="get">
          <label>Search accounts by profile name<input defaultValue={data.search} maxLength={100} name="q" placeholder="Type a name, then search" /></label>
          <button type="submit"><Search size={14} aria-hidden="true" /> Search</button>
        </form>
        <form action={changeAccountRole} className={styles.operatorForm}>
          <input name="returnTo" type="hidden" value="/admin/staff/" />
          <input name="role" type="hidden" value="staff" />
          <label className={styles.field} htmlFor="staff-account">Account to grant
            <select id="staff-account" name="userId" required>
              <option value="">Choose an account</option>
              {data.candidateAccounts.map((account) => <option key={account.id} value={account.id}>{account.name} · {account.accountType}</option>)}
            </select>
          </label>
          <button className={styles.primaryButton} disabled={data.candidateAccounts.length === 0} name="operation" type="submit" value="assign"><UserRoundPlus size={14} aria-hidden="true" /> Grant staff role</button>
        </form>
        {data.candidateAccounts.length === 0 && <p className={styles.formHint}>No matching profiles are available. Search another name or use Accounts &amp; roles to review the full account list.</p>}

        <div className={adminStyles.catalogFootnote}>
          <div><span className={adminStyles.metricIcon}><ShieldCheck size={16} aria-hidden="true" /></span><div><strong>Least-privilege access</strong><p>Staff can access only event assignments granted here. Removing the staff role also revokes active event assignments.</p></div></div>
          <Link href="/admin/#accounts">Accounts &amp; roles <ArrowRight size={14} aria-hidden="true" /></Link>
        </div>
      </section>

      <section className={adminStyles.section} id="staff-list">
        <div className={adminStyles.sectionHeading}>
          <div><p className={adminStyles.eyebrow}>ACTIVE ROLE ASSIGNMENTS</p><h2>Event staff</h2><p>Assign only the events a staff member needs to support.</p></div>
          <span className={adminStyles.countBadge}>{data.pagination.totalItems} staff accounts</span>
        </div>

        {data.staff.length === 0 ? (
          <div className={adminStyles.emptyState}><span><UsersRound size={22} aria-hidden="true" /></span><div><strong>No staff accounts on this page</strong><p>Grant an event staff role above to add the first account.</p></div></div>
        ) : (
          <div className={adminStyles.accountList}>
            {data.staff.map((staff) => (
              <article className={adminStyles.accountRow} key={staff.id}>
                <div className={adminStyles.accountIdentity}>
                  <span className={adminStyles.accountAvatar}>{initials(staff.name)}</span>
                  <div><strong>{staff.name}</strong><p>{staff.accountType}<span>·</span>Added {new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(staff.createdAt)}</p></div>
                </div>
                <div className={adminStyles.accountRoles}><span className={adminStyles.roleChip}>Event staff</span></div>
                <form action={changeAccountRole} className={adminStyles.roleForm}>
                  <input name="userId" type="hidden" value={staff.id} /><input name="role" type="hidden" value="staff" /><input name="returnTo" type="hidden" value="/admin/staff/" />
                  <button className={adminStyles.revokeButton} name="operation" type="submit" value="revoke">Revoke role</button>
                </form>
                <div className={adminStyles.staffAssignments}>
                  <div><strong>Assigned events</strong><p>Each assignment is checked on the server.</p></div>
                  <form action={changeStaffEventAssignment} className={adminStyles.staffAssignForm}>
                    <input name="userId" type="hidden" value={staff.id} /><input name="returnTo" type="hidden" value="/admin/staff/" />
                    <label className={adminStyles.srOnly} htmlFor={`staff-event-${staff.id}`}>Event for {staff.name}</label>
                    <select id={`staff-event-${staff.id}`} name="eventSlug" defaultValue="" required>
                      <option value="" disabled>Choose event</option>
                      {data.events.filter((event) => !staff.events.some((assignment) => assignment.slug === event.slug)).map((event) => <option value={event.slug} key={event.slug}>{event.title}</option>)}
                    </select>
                    <button disabled={staff.events.length >= data.events.length} name="operation" type="submit" value="assign">Assign event</button>
                  </form>
                  {staff.events.length > 0 ? <ul className={adminStyles.staffAssignmentList} aria-label={`Assigned events for ${staff.name}`}>
                    {staff.events.map((event) => <li key={event.id}>
                      <span><strong>{event.title}</strong><small>{event.dateLabel}</small></span>
                      <form action={changeStaffEventAssignment}>
                        <input name="userId" type="hidden" value={staff.id} /><input name="eventSlug" type="hidden" value={event.slug} /><input name="returnTo" type="hidden" value="/admin/staff/" />
                        <button name="operation" type="submit" value="revoke">Revoke event</button>
                      </form>
                    </li>)}
                  </ul> : <p className={adminStyles.noStaffAssignments}>No event access assigned.</p>}
                </div>
              </article>
            ))}
          </div>
        )}

        {data.pagination.totalPages > 1 && <nav className={adminStyles.pagination} aria-label="Staff pages"><span>Page {data.pagination.page} of {data.pagination.totalPages} · {data.pagination.totalItems} staff</span><div>{previous ? <Link href={previous}>Previous</Link> : <span aria-disabled="true">Previous</span>}{next ? <Link href={next}>Next</Link> : <span aria-disabled="true">Next</span>}</div></nav>}
      </section>
    </AdminPanelShell>
  );
}
