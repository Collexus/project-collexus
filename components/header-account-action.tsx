"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { Icon } from "@/components/icon";
import { getSupabaseClient } from "@/lib/supabase-client";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export function HeaderAccountAction() {
  const [user, setUser] = useState<User | null>(null);

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

  if (user) {
    const name = String(user.user_metadata.full_name ?? user.user_metadata.name ?? "Your profile");
    return <a id="profileButton" href={`${basePath}/profile/`} className="profile-icon-btn" aria-label={`Open ${name}'s profile`} title={name}><Icon name="person" /></a>;
  }

  return (
    <a id="loginButton" href={`${basePath}/login/`} aria-label="Login or sign up" className="login-btn inline-flex items-center gap-2 px-3.5 sm:px-5 py-2.5 rounded-xl bg-primary text-on-primary font-label-lg text-label-lg uppercase tracking-wider shadow-[0_6px_18px_rgba(38,12,26,.16)]">
      <span className="login-btn-label">Login / Sign Up</span>
    </a>
  );
}
