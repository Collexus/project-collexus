"use client";

import { useEffect, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import Link from "next/link";
import { BadgeCheck, CircleHelp, ClipboardList, LogOut, ShieldCheck, UserRound } from "lucide-react";
import { Icon } from "@/components/icon";
import { getSupabaseClient } from "@/lib/supabase-client";
import styles from "./header-account-action.module.css";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function HeaderAccountAction() {
  const [user, setUser] = useState<User | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    let active = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (active) setUser(data.session?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) setMenuOpen(false);
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setMenuOpen(false);
      buttonRef.current?.focus();
    };
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [menuOpen]);

  if (user) {
    const name = String(user.user_metadata.full_name ?? user.user_metadata.name ?? "Your profile");
    const email = user.email ?? "Signed in to Collexus";
    const initials = name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "C";
    const profileLinks = [
      { label: "Profile", href: `${basePath}/profile/`, Icon: UserRound },
      { label: "Account & privacy", href: `${basePath}/profile/edit/`, Icon: ShieldCheck },
      { label: "Registrations & orders", href: `${basePath}/registrations/`, Icon: ClipboardList },
      { label: "Help", href: `${basePath}/help/`, Icon: CircleHelp },
      { label: "About Collexus", href: `${basePath}/about/`, Icon: UserRound },
    ];

    async function signOut() {
      const supabase = getSupabaseClient();
      if (!supabase) {
        setSignOutError("We couldn’t connect to your account. Try again.");
        return;
      }
      setSigningOut(true);
      setSignOutError("");
      try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        window.location.assign(`${basePath}/`);
      } catch {
        setSignOutError("Sign out didn’t finish. Please try again.");
        setSigningOut(false);
      }
    }

    return (
      <div className={styles.root} ref={rootRef}>
        <button
          ref={buttonRef}
          id="profileButton"
          className={styles.profileButton}
          type="button"
          aria-label={`Open ${name}'s profile menu`}
          aria-expanded={menuOpen}
          aria-controls="profileDropdown"
          title={name}
          onClick={() => { setSignOutError(""); setMenuOpen((open) => !open); }}
        ><Icon name="person" /></button>

        <div className={styles.dropdown} id="profileDropdown" hidden={!menuOpen}>
          <div className={styles.identity}>
            <span className={styles.avatar} aria-hidden="true">{initials}</span>
            <div className={styles.identityCopy}>
              <small className={styles.identityEyebrow}>COLLEXUS ACCOUNT</small>
              <strong>{name}</strong>
              <span>{email}</span>
            </div>
            <span className={styles.identityBadge} title="Signed in"><BadgeCheck size={14} aria-hidden="true" /> <span>Signed in</span></span>
          </div>
          <nav className={styles.links} aria-label="Profile navigation">
            {profileLinks.map(({ label, href, Icon: ItemIcon }) => <Link href={href} key={label} onClick={() => setMenuOpen(false)}><ItemIcon size={17} aria-hidden="true" /><span>{label}</span></Link>)}
          </nav>
          {signOutError && <p className={styles.error} role="alert">{signOutError}</p>}
          <button className={styles.signOut} type="button" onClick={signOut} disabled={signingOut}>
            <LogOut size={17} aria-hidden="true" /><span>{signingOut ? "Signing out…" : "Sign out"}</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <a id="loginButton" href={`${basePath}/login/`} aria-label="Login or sign up" className="login-btn inline-flex items-center gap-2 px-3.5 sm:px-5 py-2.5 rounded-xl bg-primary text-on-primary font-label-lg text-label-lg uppercase tracking-wider shadow-[0_6px_18px_rgba(38,12,26,.16)]">
      <span className="login-btn-label">Login / Sign Up</span>
    </a>
  );
}
