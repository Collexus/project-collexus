import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ChefHat, CircleCheck, Store } from "lucide-react";
import { ApiError } from "@/lib/backend/errors";
import { getPrisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth";
import { addStallMenuItem, changeOwnMenuItemAvailability } from "@/app/stall-panel/actions";
import styles from "@/app/host-panels.module.css";

export const metadata: Metadata = {
  title: "Stall host panel | Collexus",
  description: "Manage menus for your approved Collexus stall assignments.",
  robots: { index: false, follow: false },
};

type PageProps = { searchParams: Promise<{ error?: string; notice?: string }> };

const errors: Record<string, string> = {
  "invalid-menu-item": "Check the menu item name, price, and details, then try again.",
  "stall-assignment-required": "This stall is no longer assigned to your account. Refresh the page or contact an administrator.",
  "save-failed": "We could not save that change. Please try again.",
};
const notices: Record<string, string> = {
  "menu-item-added": "Menu item added.",
  "availability-updated": "Menu availability updated.",
};

export default async function StallHostPanelPage({ searchParams }: PageProps) {
  if (!process.env.DATABASE_URL) {
    return <main className={styles.page}><div className={styles.container}><section className={styles.empty}><strong>Stall records are not connected yet</strong><p>The stall panel needs the server database connection and the host access migration. Configure those before loading private stall records.</p><Link className={styles.actionLink} href="/">Return to Collexus</Link></section></div></main>;
  }

  let user;
  try {
    ({ user } = await requireRole("stall_operator"));
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) redirect(`/login/?next=${encodeURIComponent("/stall-panel/")}`);
    if (error instanceof ApiError && error.status === 403) {
      return <main className={styles.page}><div className={styles.container}><section className={styles.empty}><strong>Stall host access is not active</strong><p>Submit a stall request. Collexus enables this panel after an administrator approves and assigns the stall.</p><Link className={styles.actionLink} href="/stall-registration/">Request a stall</Link></section></div></main>;
    }
    throw error;
  }

  const params = await searchParams;
  const [assignments] = await Promise.all([
    getPrisma().foodStallOperatorAssignment.findMany({
      where: { userId: user.id, revokedAt: null, stall: { status: { not: "archived" } } },
      orderBy: { createdAt: "desc" },
      include: { stall: { include: { menuItems: { orderBy: { createdAt: "desc" }, take: 100 } } } },
    }),
  ]);

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <div className={styles.topbar}><Link className={styles.brand} href="/">COLLEXUS · STALL HOST</Link><nav aria-label="Stall host navigation"><Link href="/profile/">Profile</Link><Link href="/stall-registration/">Request a stall</Link></nav></div>
        <section className={styles.hero}>
          <div><p className={styles.eyebrow}>STALL OPERATIONS</p><h1>Your stall workspace</h1><p>Manage menu items only for stalls actively assigned to your account. Stall publication, orders, payments, and other stalls remain outside this panel.</p></div>
          <span className={styles.heroIcon} aria-hidden="true"><ChefHat size={28} /></span>
        </section>

        {params.error && errors[params.error] && <p className={styles.notice} role="alert">{errors[params.error]}</p>}
        {params.notice && notices[params.notice] && <p className={`${styles.notice} ${styles.noticeSuccess}`} role="status">{notices[params.notice]}</p>}

        <section className={styles.section} aria-labelledby="assigned-stalls-heading">
          <div className={styles.sectionHead}><div><h2 id="assigned-stalls-heading">Assigned stalls</h2><p>Menu actions are checked again against the signed-in operator on the server.</p></div><span className={styles.count}>{assignments.length} stalls</span></div>
          {assignments.length === 0 ? <div className={styles.empty}><strong>No active stall assignments</strong><p>An administrator will assign the approved stall to your account. Once assigned, it will appear here and in your profile menu.</p><Link className={styles.actionLink} href="/stall-registration/">Submit a stall request</Link></div> : (
            <div className={styles.stallGrid}>
              {assignments.map(({ stall }) => <article className={styles.stallCard} key={stall.id}>
                <header><div><h3>{stall.name}</h3><p>{stall.category}{stall.location ? ` · ${stall.location}` : ""}</p></div><span className={styles.status}>{stall.status.replaceAll("_", " ")}</span></header>
                <p className={styles.footnote}>Stall publication status is controlled by an administrator.</p>
                <h4 className={styles.menuTitle}>Menu items ({stall.menuItems.length})</h4>
                {stall.menuItems.length ? <ul className={styles.menu}>{stall.menuItems.map((item) => <li className={styles.menuItem} key={item.id}>
                  <span><strong>{item.name}</strong><small>{item.description || "No description"} · ₹{(item.pricePaise / 100).toFixed(2)} · {item.isAvailable ? "Available" : "Unavailable"}</small></span>
                  <form action={changeOwnMenuItemAvailability}><input type="hidden" name="menuItemId" value={item.id} /><button className={styles.smallButton} type="submit" name="operation" value={item.isAvailable ? "disable" : "enable"}>{item.isAvailable ? "Disable" : "Enable"}</button></form>
                </li>)}</ul> : <p className={styles.empty}><strong>No menu items</strong><span>Add the items customers can order after the stall is published.</span></p>}
                <form action={addStallMenuItem} className={styles.addForm}>
                  <input type="hidden" name="stallId" value={stall.id} />
                  <label className={styles.field}>Item name<input name="name" required maxLength={120} /></label>
                  <label className={styles.field}>Description<input name="description" maxLength={300} /></label>
                  <label className={styles.field}>Price (₹)<input name="priceRupees" inputMode="decimal" placeholder="0.00" required /></label>
                  <button className={styles.smallButton} type="submit"><CircleCheck size={14} aria-hidden="true" /> Add item</button>
                </form>
                <p className={styles.footnote}><Store size={13} aria-hidden="true" /> Changes apply only to this assigned stall. Menu images and order processing are not enabled in this panel yet.</p>
              </article>)}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
