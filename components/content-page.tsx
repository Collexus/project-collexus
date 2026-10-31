import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowRight, Compass, HelpCircle, Info, TicketCheck, UserRound } from "lucide-react";
import styles from "./content-page.module.css";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const navigation = [
  { href: "/#featured-events", label: "Explore events", icon: Compass },
  { href: "/profile/", label: "Profile", icon: UserRound },
  { href: "/registrations/", label: "My registrations", icon: TicketCheck },
  { href: "/help/", label: "Help", icon: HelpCircle },
  { href: "/about/", label: "About", icon: Info },
];

export function ContentPage({
  active,
  eyebrow,
  title,
  description,
  children,
}: {
  active: string;
  eyebrow: string;
  title: ReactNode;
  description: string;
  children: ReactNode;
}) {
  return (
    <main className={styles.page} id="main-content" tabIndex={-1}>
      <header className={styles.header}>
        <Link className={styles.brand} href="/" aria-label="Collexus home">
          <span className={styles.logoFrame}><Image src={`${basePath}/collexus-logo.svg`} alt="" width={36} height={36} /></span>
          <span>Collexus</span>
        </Link>
        <nav className={styles.navigation} aria-label="Account and site navigation">
          {navigation.map(({ href, label, icon: Icon }) => (
            <Link key={href} className={styles.navLink} href={href} aria-current={active === href ? "page" : undefined}>
              <Icon size={16} aria-hidden="true" /><span>{label}</span>
            </Link>
          ))}
        </nav>
      </header>

      <div className={styles.shell}>
        <section className={styles.hero}>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}><span aria-hidden="true" />{eyebrow}</p>
            <h1>{title}</h1>
            <p className={styles.lede}>{description}</p>
          </div>
          <aside className={styles.heroNote}>
            <span className={styles.noteIcon}><Compass size={20} aria-hidden="true" /></span>
            <p className={styles.noteKicker}>YOUR CAMPUS, IN ONE PLACE</p>
            <p className={styles.noteCopy}>Find events, keep your details close, and get answers when you need them.</p>
            <Link href="/#featured-events" className={styles.noteLink}>Browse the event feed <ArrowRight size={16} aria-hidden="true" /></Link>
          </aside>
        </section>
        {children}
        <footer className={styles.footer}>
          <span>Collexus · Campus events, in one place.</span>
          <nav aria-label="Footer navigation">
            <Link href="/about/">About</Link><Link href="/help/">Help</Link><Link href="/profile/">Profile</Link>
          </nav>
        </footer>
      </div>
    </main>
  );
}
