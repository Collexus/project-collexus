"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { getSupabaseClient } from "@/lib/supabase-client";
import styles from "./admin.module.css";

export function AdminSignOutButton() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function signOut() {
    if (busy) return;
    setBusy(true);
    setError("");
    const supabase = getSupabaseClient();
    if (!supabase) {
      setError("Sign out is unavailable because Supabase Auth is not configured.");
      setBusy(false);
      return;
    }

    try {
      const { error: signOutError } = await supabase.auth.signOut({ scope: "local" });
      if (signOutError) throw signOutError;
      window.location.assign("/admin/login/");
    } catch {
      setError("Could not sign out. Please try again.");
      setBusy(false);
    }
  }

  return (
    <div className={styles.signOutWrap}>
      <button className={styles.signOutButton} disabled={busy} onClick={() => void signOut()} type="button">
        <LogOut size={15} aria-hidden="true" /> {busy ? "Signing out…" : "Sign out"}
      </button>
      {error && <span className={styles.signOutError} role="alert">{error}</span>}
    </div>
  );
}
