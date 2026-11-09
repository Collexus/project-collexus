import type { ReactNode } from "react";
import Link from "next/link";
import { Activity, ArrowLeft, ClipboardCheck, FileClock, Landmark, ShieldCheck, Store, UsersRound } from "lucide-react";
import { AdminSignOutButton } from "@/app/admin/admin-sign-out-button";
import styles from "./admin.module.css";

type AdminPanelSection = "overview" | "events" | "stalls" | "staff";

const navigation = [
  { id: "overview", label: "Overview", href: "/admin/", icon: Activity },
  { id: "events", label: "Events", href: "/admin/events/", icon: ClipboardCheck },
  { id: "stalls", label: "Stalls", href: "/admin/stalls/", icon: Store },
  { id: "staff", label: "Staff", href: "/admin/staff/", icon: UsersRound },
] as const;

export function AdminPanelShell({
  active,
  email,
  children,
}: {
  active: AdminPanelSection;
  email: string;
  children: ReactNode;
}) {
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
            {navigation.map(({ id, label, href, icon: Icon }) => (
              <Link aria-current={active === id ? "page" : undefined} className={active === id ? styles.navActive : undefined} href={href} key={id}>
                <Icon size={17} aria-hidden="true" /> {label}
              </Link>
            ))}
            <Link href="/admin/#accounts"><UsersRound size={17} aria-hidden="true" /> Accounts &amp; roles</Link>
            <Link href="/admin/#audit-log"><FileClock size={17} aria-hidden="true" /> Audit history</Link>
          </nav>
          <div className={styles.sidebarNote}>
            <ShieldCheck size={17} aria-hidden="true" />
            <p>Admin actions are checked on the server and written to the audit history.</p>
          </div>
          <Link className={styles.backLink} href="/"><ArrowLeft size={16} aria-hidden="true" /> View public site</Link>
        </aside>

        <section className={styles.mainColumn}>
          <header className={styles.topbar}>
            <div>
              <span className={styles.breadcrumb}>Workspace <span>/</span> {navigation.find(({ id }) => id === active)?.label}</span>
              <p>Signed in as <strong>{email || "administrator"}</strong></p>
            </div>
            <div className={styles.topbarActions}>
              <div className={styles.secureBadge}><ShieldCheck size={16} aria-hidden="true" /> Admin session</div>
              <AdminSignOutButton />
            </div>
          </header>
          <div className={styles.content}>{children}</div>
        </section>
      </div>
    </main>
  );
}

export function AdminPanelAccessMessage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main id="main-content" tabIndex={-1} className={styles.accessPage}>
      <section className={styles.accessCard}>
        <span className={styles.brandMark}><ShieldCheck size={22} aria-hidden="true" /></span>
        <p className={styles.eyebrow}>COLLEXUS ADMIN</p>
        <h1>{title}</h1>
        <p>{children}</p>
        <Link className={styles.backHome} href="/admin/"><ArrowLeft size={16} aria-hidden="true" /> Back to admin overview</Link>
      </section>
    </main>
  );
}
