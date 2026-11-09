import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CircleDollarSign, Menu, Plus, ShieldCheck, Store, UsersRound } from "lucide-react";
import { changeFoodMenuItemAvailability, changeFoodStallOperatorAssignment, createFoodMenuItem, createFoodStall, reviewStallSubmission, updateFoodStall } from "@/app/admin/actions";
import { AdminPanelAccessMessage, AdminPanelShell } from "@/app/admin/admin-panel-shell";
import { getAdminStallPanelData, type AdminStallSubmissionStatus } from "@/lib/admin/panel-data";
import { foodStallCategories } from "@/lib/admin/schemas";
import { requireAdminPanel } from "@/lib/admin/page-auth";
import adminStyles from "../admin.module.css";
import styles from "../admin-panels.module.css";

export const metadata: Metadata = {
  title: "Stall management | Collexus Admin",
  description: "Manage campus food stalls, menus, availability, and operator assignments.",
  robots: { index: false, follow: false },
};

type PageProps = { searchParams: Promise<{ page?: string; requestPage?: string; requestStatus?: string; error?: string; notice?: string }> };

const messages: Record<string, { tone: "error" | "success"; text: string }> = {
  "invalid-stall": { tone: "error", text: "Check the stall details and event selection, then try again." },
  "stall-create-failed": { tone: "error", text: "The stall could not be created. Refresh and try again." },
  "stall-created": { tone: "success", text: "The stall was created and recorded in the audit history." },
  "stall-not-found": { tone: "error", text: "That stall record could not be found. Refresh the page." },
  "stall-update-failed": { tone: "error", text: "The stall changes could not be saved. Refresh and try again." },
  "stall-updated": { tone: "success", text: "The stall details and status were updated." },
  "invalid-menu-item": { tone: "error", text: "Check the menu item name and price. Prices can use up to two decimal places." },
  "menu-item-create-failed": { tone: "error", text: "The menu item could not be saved. Refresh and try again." },
  "menu-item-created": { tone: "success", text: "The menu item was added." },
  "menu-item-not-found": { tone: "error", text: "That menu item could not be found. Refresh the page." },
  "menu-item-update-failed": { tone: "error", text: "The menu availability could not be changed. Refresh and try again." },
  "menu-item-updated": { tone: "success", text: "Menu availability was updated." },
  "invalid-stall-operator": { tone: "error", text: "Choose a valid stall operator and try again." },
  "stall-operator-role-required": { tone: "error", text: "Grant the Stall operator role in Accounts & roles before assigning a stall." },
  "stall-assignment-not-active": { tone: "error", text: "That operator assignment is not currently active." },
  "stall-assignment-failed": { tone: "error", text: "The stall operator assignment could not be saved." },
  "stall-assignment-updated": { tone: "success", text: "The stall operator assignment was updated and audited." },
  "invalid-stall-review": { tone: "error", text: "Choose a valid stall request and review decision." },
  "stall-review-not-pending": { tone: "error", text: "That stall request has already been reviewed." },
  "stall-review-failed": { tone: "error", text: "The stall request could not be reviewed. Refresh and try again." },
  "stall-request-approved": { tone: "success", text: "The request was approved. A draft stall was created, and the host received Stall panel access." },
  "stall-request-rejected": { tone: "success", text: "The stall request was declined and the decision was recorded." },
};

function parsePage(value?: string) {
  const page = Number(value);
  return Number.isSafeInteger(page) && page > 0 ? page : 1;
}

function paginationHref(page: number) {
  return `/admin/stalls/?page=${page}#stall-list`;
}

function requestPaginationHref(page: number, status: AdminStallSubmissionStatus) {
  return `/admin/stalls/?requestPage=${page}&requestStatus=${status}#stall-requests`;
}

function safeRequestStatus(value?: string): AdminStallSubmissionStatus {
  return value === "approved" || value === "rejected" ? value : "pending_review";
}

function formatMoney(pricePaise: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(pricePaise / 100);
}

function statusClass(status: string) {
  if (status === "active") return `${styles.stallStatus} ${styles.statusActive}`;
  if (status === "paused") return `${styles.stallStatus} ${styles.statusPaused}`;
  if (status === "archived") return `${styles.stallStatus} ${styles.statusArchived}`;
  return styles.stallStatus;
}

export default async function AdminStallsPage({ searchParams }: PageProps) {
  const user = await requireAdminPanel("/admin/stalls/");
  if (!user) return <AdminPanelAccessMessage title="Administrator access required">This section is restricted to accounts with an explicitly assigned administrator role.</AdminPanelAccessMessage>;
  if (!process.env.DATABASE_URL) return <AdminPanelAccessMessage title="Database connection needs setup">Set the server-side database connection and apply the admin-console and food-stall migrations before managing stalls.</AdminPanelAccessMessage>;

  const params = await searchParams;
  const requestStatus = safeRequestStatus(params.requestStatus);
  let data: Awaited<ReturnType<typeof getAdminStallPanelData>>;
  try {
    data = await getAdminStallPanelData(parsePage(params.page), parsePage(params.requestPage), requestStatus);
  } catch (error) {
    console.error(JSON.stringify({ level: "error", message: "Admin stall panel could not load records", errorName: error instanceof Error ? error.name : "UnknownError" }));
    return <AdminPanelAccessMessage title="Stall records are unavailable">The stall panel could not load its current records. Check the database configuration and applied migrations.</AdminPanelAccessMessage>;
  }

  const message = params.notice ? messages[params.notice] : params.error ? messages[params.error] : undefined;
  const previous = data.pagination.page > 1 ? paginationHref(data.pagination.page - 1) : null;
  const next = data.pagination.page < data.pagination.totalPages ? paginationHref(data.pagination.page + 1) : null;
  const requestPrevious = data.requestPagination.page > 1 ? requestPaginationHref(data.requestPagination.page - 1, requestStatus) : null;
  const requestNext = data.requestPagination.page < data.requestPagination.totalPages ? requestPaginationHref(data.requestPagination.page + 1, requestStatus) : null;

  return (
    <AdminPanelShell active="stalls" email={user.email ?? "administrator"}>
      {message && <p className={`${adminStyles.notice} ${message.tone === "error" ? adminStyles.noticeError : adminStyles.noticeSuccess}`} role={message.tone === "error" ? "alert" : "status"}>{message.text}</p>}

      <section className={adminStyles.hero}>
        <div><p className={adminStyles.eyebrow}>CAMPUS MARKET OPERATIONS</p><h1>Stall management</h1><p>Create and update stalls, maintain menus, and give operators access only to their assigned stall.</p></div>
        <span className={adminStyles.heroMark}><Store size={30} aria-hidden="true" /></span>
      </section>

      <section className={adminStyles.metrics} aria-label="Stall totals">
        <article className={adminStyles.metricCard}><span className={`${adminStyles.metricIcon} ${adminStyles.iconTeal}`}><Store size={17} aria-hidden="true" /></span><p>Stall records</p><strong>{data.counts.total.toLocaleString("en-IN")}</strong><small>Saved in Collexus</small></article>
        <article className={adminStyles.metricCard}><span className={`${adminStyles.metricIcon} ${adminStyles.iconBlue}`}><CircleDollarSign size={17} aria-hidden="true" /></span><p>Active stalls</p><strong>{data.counts.active.toLocaleString("en-IN")}</strong><small>Available for operation</small></article>
        <article className={adminStyles.metricCard}><span className={`${adminStyles.metricIcon} ${adminStyles.iconViolet}`}><Menu size={17} aria-hidden="true" /></span><p>Menu items</p><strong>{data.counts.menuItems.toLocaleString("en-IN")}</strong><small>Prices stored in paise</small></article>
      </section>

      <section className={adminStyles.section} id="stall-requests">
        <div className={adminStyles.sectionHeading}>
          <div><p className={adminStyles.eyebrow}>HOST APPLICATIONS</p><h2>Stall requests</h2><p>Approval creates a draft stall, imports its menu, assigns the applicant, and grants access to the Stall panel.</p></div>
          <span className={adminStyles.countBadge}>{data.counts.pendingRequests.toLocaleString("en-IN")} awaiting review</span>
        </div>

        <nav className={styles.filterTabs} aria-label="Filter stall requests">
          {([
            ["pending_review", "Needs review", data.counts.pendingRequests],
            ["approved", "Approved", data.counts.approvedRequests],
            ["rejected", "Declined", data.counts.rejectedRequests],
          ] as const).map(([value, label, count]) => (
            <Link aria-current={requestStatus === value ? "page" : undefined} href={`/admin/stalls/?requestStatus=${value}#stall-requests`} key={value}>{label}<span>{count}</span></Link>
          ))}
        </nav>

        {data.requests.length === 0 ? (
          <div className={adminStyles.emptyState}><span><Store size={22} aria-hidden="true" /></span><div><strong>{requestStatus === "pending_review" ? "No stall requests need review" : `No ${requestStatus === "approved" ? "approved" : "declined"} requests yet`}</strong><p>New applications submitted by stall hosts appear here.</p></div></div>
        ) : (
          <div className={adminStyles.submissionList}>
            {data.requests.map((submission) => {
              const request = submission.request;
              const selectedEventName = request?.stall.eventName === "Other / not listed" ? request.stall.customEventName : request?.stall.eventName;
              return (
                <article className={adminStyles.submissionCard} key={submission.id}>
                  <div className={adminStyles.submissionTop}>
                    <span className={submission.status === "pending_review" ? adminStyles.pendingPill : adminStyles.statusPill}>{submission.status === "pending_review" ? <><span /> Needs review</> : submission.status}</span>
                    <time dateTime={submission.createdAt.toISOString()}>Submitted {new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(submission.createdAt)}</time>
                  </div>
                  <div className={adminStyles.submissionBody}>
                    <div>
                      <h3>{request?.stall.name ?? "Request details need review"}</h3>
                      {request ? <>
                        <p className={adminStyles.submissionMeta}>{request.stall.category} · {selectedEventName} · {request.stall.eventDate || "Date to be confirmed"}</p>
                        <div className={styles.submissionDetails}>
                          <span><strong>Contact:</strong> {request.contact.name} · {request.contact.organization}</span>
                          <span><strong>Email:</strong> {request.contact.email}</span>
                          <span><strong>Phone:</strong> {request.contact.phone}</span>
                          <span><strong>Stall:</strong> {request.stall.size} · {request.stall.locationPreference} · {request.stall.teamSize}</span>
                          <span><strong>Facilities:</strong> {[request.stall.power && "Power", request.stall.water && "Water", request.stall.stallBox && "Storage"].filter(Boolean).join(", ") || "None requested"}</span>
                          {request.stall.foodSafety && <span><strong>Food safety:</strong> {request.stall.foodSafety}</span>}
                        </div>
                        {request.stall.setupNotes && <p className={styles.submissionDescription}>{request.stall.setupNotes}</p>}
                        <details className={adminStyles.organizerDetails}>
                          <summary>Menu and team details</summary>
                          {request.menuItems.map((item, index) => <p key={`${item.name}-${index}`}><strong>{item.name}</strong> · Offer ₹{item.offerPrice} · Event day ₹{item.eventDayPrice}</p>)}
                          <p><strong>Team:</strong> {request.people.map((person) => `${person.name} (${person.phone})`).join(" · ")}</p>
                        </details>
                      </> : <p className={styles.submissionDescription}>The saved request does not match the current application format. Submission ID: {submission.id.slice(0, 8).toUpperCase()}</p>}
                    </div>
                    {submission.status === "pending_review" ? (
                      <form action={reviewStallSubmission} className={styles.reviewActions}>
                        <input name="submissionId" type="hidden" value={submission.id} />
                        <label className={styles.field}>Review note<textarea maxLength={1200} name="note" placeholder="Record any follow-up or decision context." /></label>
                        <div className={styles.decisionButtons}>
                          <button disabled={!request} name="decision" type="submit" value="approved">Approve and grant Stall panel</button>
                          <button name="decision" type="submit" value="rejected">Decline request</button>
                        </div>
                      </form>
                    ) : (
                      <div className={adminStyles.reviewedRow}><span className={`${adminStyles.statusPill} ${submission.status === "approved" ? adminStyles.statusApproved : adminStyles.statusRejected}`}>{submission.status}</span><span>{submission.reviewNote || "No review note"}{submission.createdStall && <> · Created <Link href="/admin/stalls/#stall-list">{submission.createdStall.name}</Link></>}</span>{submission.reviewedAt && <time dateTime={submission.reviewedAt.toISOString()}>{new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(submission.reviewedAt)}</time>}</div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {data.requestPagination.totalPages > 1 && <nav className={adminStyles.pagination} aria-label="Stall request pages"><span>Page {data.requestPagination.page} of {data.requestPagination.totalPages} · {data.requestPagination.totalItems} requests</span><div>{requestPrevious ? <Link href={requestPrevious}>Previous</Link> : <span aria-disabled="true">Previous</span>}{requestNext ? <Link href={requestNext}>Next</Link> : <span aria-disabled="true">Next</span>}</div></nav>}
      </section>

      <section className={adminStyles.section}>
        <div className={adminStyles.sectionHeading}>
          <div><p className={adminStyles.eyebrow}>NEW STALL</p><h2>Create a stall record</h2><p>New stalls start as drafts unless you explicitly activate them.</p></div>
        </div>
        <form action={createFoodStall}>
          <input name="returnTo" type="hidden" value="/admin/stalls/" />
          <div className={styles.formGrid}>
            <label className={styles.field}>Stall name<input autoComplete="off" maxLength={160} name="name" placeholder="e.g. Campus Bites" required /></label>
            <label className={styles.field}>Category<select defaultValue="" name="category" required><option value="" disabled>Choose a category</option>{foodStallCategories.map((category) => <option key={category} value={category}>{category}</option>)}</select></label>
            <label className={styles.field}>Associated event<select defaultValue="" name="eventSlug"><option value="">No event linked</option>{data.events.map((event) => <option key={event.slug} value={event.slug}>{event.title} · {event.dateLabel}</option>)}</select></label>
            <label className={styles.field}>Location<input maxLength={200} name="location" placeholder="Courtyard, block, or campus area" /></label>
            <label className={`${styles.field} ${styles.spanTwo}`}>Description<textarea maxLength={600} name="description" placeholder="Short description for the admin record." /></label>
            <label className={styles.field}>Initial status<select defaultValue="draft" name="status"><option value="draft">Draft</option><option value="active">Active</option></select></label>
          </div>
          <div className={styles.formActions}><button className={styles.primaryButton} type="submit"><Plus size={15} aria-hidden="true" /> Create stall</button></div>
        </form>
      </section>

      <section className={adminStyles.section} id="stall-list">
        <div className={adminStyles.sectionHeading}>
          <div><p className={adminStyles.eyebrow}>STALLS &amp; MENUS</p><h2>Stall records</h2><p>Pause or archive a stall without deleting its history.</p></div>
          <span className={adminStyles.countBadge}>{data.pagination.totalItems} stalls</span>
        </div>

        {data.stalls.length === 0 ? (
          <div className={adminStyles.emptyState}><span><Store size={22} aria-hidden="true" /></span><div><strong>No stall records yet</strong><p>Create the first stall above to add its menu and assign an operator.</p></div></div>
        ) : (
          <div className={styles.stallList}>
            {data.stalls.map((stall) => {
              const event = data.events.find(({ slug }) => slug === stall.eventSlug);
              return (
                <article className={styles.stallCard} key={stall.id}>
                  <div className={styles.stallHeader}>
                    <div><h3>{stall.name}</h3><p>{stall.category}{event ? ` · ${event.title}` : " · No event linked"}{stall.location ? ` · ${stall.location}` : ""}</p><p>{stall.description || "No description added."}</p></div>
                    <span className={statusClass(stall.status)}>{stall.status}</span>
                  </div>

                  <div className={styles.stallSubsection}>
                    <h4>Stall details</h4>
                    <form action={updateFoodStall}>
                      <input name="stallId" type="hidden" value={stall.id} /><input name="returnTo" type="hidden" value="/admin/stalls/" />
                      <div className={styles.formGrid}>
                        <label className={styles.field}>Name<input defaultValue={stall.name} maxLength={160} name="name" required /></label>
                        <label className={styles.field}>Category<select defaultValue={stall.category} name="category" required>{foodStallCategories.map((category) => <option key={category} value={category}>{category}</option>)}</select></label>
                        <label className={styles.field}>Event<select defaultValue={stall.eventSlug ?? ""} name="eventSlug"><option value="">No event linked</option>{data.events.map((item) => <option key={item.slug} value={item.slug}>{item.title}</option>)}</select></label>
                        <label className={styles.field}>Location<input defaultValue={stall.location ?? ""} maxLength={200} name="location" /></label>
                        <label className={`${styles.field} ${styles.spanTwo}`}>Description<textarea defaultValue={stall.description ?? ""} maxLength={600} name="description" /></label>
                        <label className={styles.field}>Status<select defaultValue={stall.status} name="status"><option value="draft">Draft</option><option value="active">Active</option><option value="paused">Paused</option><option value="archived">Archived</option></select></label>
                      </div>
                      <div className={styles.formActions}><button className={styles.secondaryButton} type="submit">Save stall details</button></div>
                    </form>
                  </div>

                  <div className={styles.stallSubsection}>
                    <h4>Menu · {stall.menuItems.length} shown</h4>
                    {stall.menuItems.length > 0 ? <ul className={styles.menuList}>
                      {stall.menuItems.map((item) => <li className={styles.menuItem} key={item.id}>
                        <span><strong>{item.name} · {formatMoney(item.pricePaise)}</strong><small>{item.description || "No description"} · {item.isAvailable ? "Available" : "Unavailable"}</small></span>
                        <form action={changeFoodMenuItemAvailability}>
                          <input name="menuItemId" type="hidden" value={item.id} /><input name="returnTo" type="hidden" value="/admin/stalls/" />
                          <button name="operation" type="submit" value={item.isAvailable ? "disable" : "enable"}>{item.isAvailable ? "Disable" : "Enable"}</button>
                        </form>
                      </li>)}
                    </ul> : <p className={styles.emptyInline}>No menu items yet.</p>}
                    <form action={createFoodMenuItem} className={`${styles.inlineForm} ${styles.stallSubsection}`}>
                      <input name="stallId" type="hidden" value={stall.id} /><input name="returnTo" type="hidden" value="/admin/stalls/" />
                      <label className={styles.field}>Menu item<input maxLength={120} name="name" placeholder="Item name" required /></label>
                      <label className={styles.field}>Description<input maxLength={300} name="description" placeholder="Optional" /></label>
                      <label className={styles.field}>Price (₹)<input inputMode="decimal" max="500000" min="0" name="priceRupees" placeholder="0.00" required step="0.01" type="number" /></label>
                      <button className={styles.primaryButton} type="submit"><Plus size={14} aria-hidden="true" /> Add item</button>
                    </form>
                  </div>

                  <div className={styles.stallSubsection}>
                    <h4>Operator access</h4>
                    <form action={changeFoodStallOperatorAssignment} className={styles.operatorForm}>
                      <input name="stallId" type="hidden" value={stall.id} /><input name="returnTo" type="hidden" value="/admin/stalls/" />
                      <label className={styles.field} htmlFor={`operator-${stall.id}`}>Assign a stall operator<select defaultValue="" id={`operator-${stall.id}`} name="userId" required><option value="">Choose an operator</option>{data.operatorCandidates.filter((operator) => !stall.operators.some((assignment) => assignment.userId === operator.id)).map((operator) => <option key={operator.id} value={operator.id}>{operator.name}</option>)}</select></label>
                      <button className={styles.secondaryButton} disabled={data.operatorCandidates.length === 0} name="operation" type="submit" value="assign"><UsersRound size={14} aria-hidden="true" /> Assign operator</button>
                    </form>
                    {stall.operators.length > 0 ? <ul className={styles.operatorList}>
                      {stall.operators.map((operator) => <li key={operator.id}><span><strong>{operator.name}</strong><small>Assigned {new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(operator.createdAt)}</small></span>
                        <form action={changeFoodStallOperatorAssignment}><input name="stallId" type="hidden" value={stall.id} /><input name="userId" type="hidden" value={operator.userId} /><input name="returnTo" type="hidden" value="/admin/stalls/" /><button name="operation" type="submit" value="revoke">Revoke</button></form>
                      </li>)}
                    </ul> : <p className={styles.emptyInline}>No operators assigned. Grant the Stall operator role under <Link href="/admin/#accounts">Accounts &amp; roles</Link> first.</p>}
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {data.pagination.totalPages > 1 && <nav className={adminStyles.pagination} aria-label="Stall pages"><span>Page {data.pagination.page} of {data.pagination.totalPages} · {data.pagination.totalItems} stalls</span><div>{previous ? <Link href={previous}>Previous</Link> : <span aria-disabled="true">Previous</span>}{next ? <Link href={next}>Next</Link> : <span aria-disabled="true">Next</span>}</div></nav>}
      </section>

      <div className={adminStyles.catalogFootnote}><div><span className={adminStyles.metricIcon}><ShieldCheck size={16} aria-hidden="true" /></span><div><strong>Stall operator access is scoped</strong><p>Assignments require the explicit Stall operator role. Revoking that role also removes this user&apos;s active stall assignments.</p></div></div><Link href="/admin/#accounts">Manage roles <ArrowRight size={14} aria-hidden="true" /></Link></div>
    </AdminPanelShell>
  );
}
