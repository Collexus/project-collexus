"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { User } from "@supabase/supabase-js";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  BookOpenCheck,
  Building2,
  Check,
  Eye,
  EyeOff,
  GraduationCap,
  KeyRound,
  Mail,
  Phone,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import { getSupabaseClient, isSupabaseConfigured } from "../../lib/supabase-client";
import { updateUserProfile, type AccountType } from "../../lib/user-profile";
import styles from "./login.module.css";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

type AccountMode = "signin" | "signup" | "recovery";
type AuthUser = { email: string | null; phone: string | null; displayName: string | null; contactVerified: boolean; accountType: string | null };

const accountTypes: { id: AccountType; label: string; detail: string; icon: typeof GraduationCap }[] = [
  { id: "student", label: "Student", detail: "College community", icon: GraduationCap },
  { id: "faculty", label: "Faculty", detail: "Staff & educators", icon: Building2 },
  { id: "guest", label: "Guest", detail: "Outside participants", icon: UsersRound },
];

function friendlyAuthError(error: unknown) {
  const details = typeof error === "object" && error !== null
    ? error as { message?: unknown; code?: unknown; status?: unknown }
    : {};
  const message = typeof details.message === "string" ? details.message : typeof error === "string" ? error : "";
  const code = typeof details.code === "string" ? details.code : "";
  const normalized = message.toLowerCase();
  if (normalized.includes("cancelled") || normalized.includes("canceled")) return "Google sign-in was closed before it finished.";
  if (normalized.includes("network") || normalized.includes("fetch")) return "Connection interrupted. Check your internet and try again.";
  if (code === "over_email_send_rate_limit") return "Authentication emails are temporarily limited for this project. Supabase’s built-in sender allows 2 emails per hour across the project. Wait for the limit to reset, or configure custom SMTP to support more signups.";
  if (code === "over_request_rate_limit") return "Supabase temporarily limited sign-up requests from this network. Wait a few minutes before trying again, and avoid repeated retries.";
  if (code === "over_sms_send_rate_limit") return "Text-message delivery is temporarily limited. Wait for the SMS limit to reset before requesting another code.";
  if (details.status === 429) return "Supabase temporarily limited this authentication request. Wait a few minutes before trying again.";
  if (normalized.includes("rate limit") || normalized.includes("too many")) return "Too many attempts. Wait a little and try again.";
  if (normalized.includes("already registered") || normalized.includes("already exists")) return "That account may already exist. Try signing in or use another email address.";
  if (normalized.includes("email not confirmed")) return "Verify your email using the link we sent before signing in.";
  return "We couldn’t complete sign-in. Check your details and try again.";
}

function normalizePhoneNumber(value: string) {
  return value.trim().replace(/[\s().-]/g, "");
}

function isInternationalPhoneNumber(value: string) {
  return /^\+[1-9]\d{7,14}$/.test(value);
}

export function LoginExperience() {
  const [accountType, setAccountType] = useState<AccountType>("student");
  const [mode, setMode] = useState<AccountMode>("signin");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [needsMobileNumber, setNeedsMobileNumber] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [configured, setConfigured] = useState(false);

  useEffect(() => {
    let active = true;
    let unsubscribe: (() => void) | undefined;

    async function watchSession() {
      setConfigured(isSupabaseConfigured());
      const supabase = getSupabaseClient();
      if (!supabase) {
        setCheckingSession(false);
        return;
      }
      try {
        const { data: { session } } = await supabase.auth.getSession();
        let currentUser = session?.user ?? null;
        const pendingAccountType = window.sessionStorage.getItem("collexus-pending-account-type");
        const isAccountType = (value: string | null): value is AccountType => value === "student" || value === "faculty" || value === "guest";
        if (session && isAccountType(pendingAccountType) && !currentUser?.user_metadata.account_type) {
          let canSaveAccountType = true;
          const { data, error: metadataError } = await supabase.auth.updateUser({ data: { account_type: pendingAccountType } });
          if (metadataError) {
            canSaveAccountType = false;
            if (active) setError("Google sign-in worked, but we couldn’t finish saving your account type. Try again after refreshing.");
          } else if (data.user) {
            currentUser = data.user;
          }

          if (canSaveAccountType) {
            const { error: profileError } = await updateUserProfile(supabase, session.user.id, { account_type: pendingAccountType });
            if (profileError) {
              if (active) setError("Your account is signed in, but profile storage isn’t ready. Apply the Collexus profiles migration, then refresh this page.");
            } else if (currentUser?.user_metadata.phone_number) {
              window.sessionStorage.removeItem("collexus-pending-account-type");
            }
          }
        } else if (session && pendingAccountType && currentUser?.user_metadata.phone_number) {
          // Keep an existing Google user's saved account type when they sign in.
          window.sessionStorage.removeItem("collexus-pending-account-type");
        }
        const setCurrentUser = (currentUser: User | null) => {
          if (active) {
            setUser(currentUser ? {
              email: currentUser.email ?? null,
              phone: currentUser.phone ?? null,
              displayName: String(currentUser.user_metadata.full_name ?? currentUser.user_metadata.name ?? "") || null,
              contactVerified: Boolean(currentUser.email_confirmed_at || currentUser.phone_confirmed_at),
              accountType: typeof currentUser.user_metadata.account_type === "string" ? currentUser.user_metadata.account_type : null,
            } : null);
            const pendingGoogleSignup = window.sessionStorage.getItem("collexus-pending-account-type");
            const savedMobileNumber = String(currentUser?.user_metadata.phone_number ?? "").trim();
            setNeedsMobileNumber(Boolean(currentUser && pendingGoogleSignup && !savedMobileNumber));
            setCheckingSession(false);
            const recoveryCallback = `${window.location.search}${window.location.hash}`.includes("type=recovery");
            const waitingForAccountType = window.sessionStorage.getItem("collexus-pending-account-type");
            if ((currentUser?.email_confirmed_at || currentUser?.phone_confirmed_at) && !recoveryCallback && !waitingForAccountType) {
              window.location.replace(`${basePath}/profile/`);
            }
          }
        };
        setCurrentUser(currentUser);
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, nextSession) => {
          if (event === "PASSWORD_RECOVERY" && active) setMode("recovery");
          setCurrentUser(nextSession?.user ?? null);
        });
        unsubscribe = () => subscription.unsubscribe();
      } catch {
        if (active) setCheckingSession(false);
      }
    }

    void watchSession();
    return () => { active = false; unsubscribe?.(); };
  }, []);

  function switchMode(nextMode: AccountMode) {
    setMode(nextMode);
    setError("");
    setMessage("");
  }

  async function submitCredentials(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setBusy(true);
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const password = String(formData.get("password") ?? "");

    try {
      const supabase = getSupabaseClient();
      if (!supabase) {
        setError("Secure sign-in is not configured yet. Add the Supabase project URL and publishable key first.");
        return;
      }

      if (formData.get("resetPassword") === "true") {
        if (!email) {
          setError("Enter your email address first, then choose Forgot password.");
          return;
        }
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}${basePath}/login/`,
        });
        if (resetError) throw resetError;
        setMessage("If an account exists for this email, a password reset link is on its way.");
        return;
      }

      if (mode === "recovery") {
        const passwordAgain = String(formData.get("passwordAgain") ?? "");
        if (password.length < 10) {
          setError("Use at least 10 characters for your new password.");
          return;
        }
        if (password !== passwordAgain) {
          setError("The passwords don’t match yet.");
          return;
        }
        const { error: updateError } = await supabase.auth.updateUser({ password });
        if (updateError) throw updateError;
        setMode("signin");
        setMessage("Your password has been updated. Sign in with your new password.");
        window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
        await supabase.auth.signOut();
        return;
      }

      if (mode === "signup") {
        const passwordAgain = String(formData.get("passwordAgain") ?? "");
        if (password.length < 10) {
          setError("Use at least 10 characters for your password.");
          return;
        }
        if (password !== passwordAgain) {
          setError("The passwords don’t match yet.");
          return;
        }
        const name = String(formData.get("name") ?? "").trim();
        const campusId = String(formData.get("campusId") ?? "").trim();
        const phone = normalizePhoneNumber(String(formData.get("phone") ?? ""));
        if (!isInternationalPhoneNumber(phone)) {
          setError("Enter your mobile number with its country code, for example +91 98765 43210.");
          return;
        }
        const { data, error: signupError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}${basePath}/login/`,
            data: {
              full_name: name,
              account_type: accountType,
              campus_id: campusId || null,
              phone_number: phone,
            },
          },
        });
        if (signupError) throw signupError;
        if (data.session && data.user?.email_confirmed_at) {
          window.location.assign(`${basePath}/profile/`);
          return;
        }
        if (data.session) await supabase.auth.signOut();
        setMessage("Check your inbox for a verification link. Verify your email, then sign in here.");
        return;
      }

      const { data, error: signinError } = await supabase.auth.signInWithPassword({ email, password });
      if (signinError) throw signinError;
      if (!data.user.email_confirmed_at) {
        await supabase.auth.signOut();
        setError("Verify your email using the link we sent before signing in.");
      } else {
        window.location.assign(`${basePath}/profile/`);
      }
    } catch (authError) {
      setError(friendlyAuthError(authError));
    } finally {
      setBusy(false);
    }
  }

  async function submitRequiredMobileNumber(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBusy(true);
    const formData = new FormData(event.currentTarget);
    const phone = normalizePhoneNumber(String(formData.get("phone") ?? ""));

    try {
      const supabase = getSupabaseClient();
      if (!supabase || !user) {
        setError("Secure account updates are not configured yet. Refresh the page and try again.");
        return;
      }
      if (!isInternationalPhoneNumber(phone)) {
        setError("Enter your mobile number with its country code, for example +91 98765 43210.");
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({ data: { phone_number: phone } });
      if (updateError) throw updateError;
      window.sessionStorage.removeItem("collexus-pending-account-type");
      setNeedsMobileNumber(false);
      window.location.assign(`${basePath}/profile/`);
    } catch (authError) {
      setError(friendlyAuthError(authError));
    } finally {
      setBusy(false);
    }
  }

  async function continueWithGoogle() {
    setError("");
    setMessage("");
    setBusy(true);
    try {
      const supabase = getSupabaseClient();
      if (!supabase) {
        setError("Secure sign-in is not configured yet. Add the Supabase project URL and publishable key first.");
        return;
      }
      if (mode === "signup") {
        window.sessionStorage.setItem("collexus-pending-account-type", accountType);
      } else {
        window.sessionStorage.removeItem("collexus-pending-account-type");
      }
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}${basePath}/login/` },
      });
      if (oauthError) throw oauthError;
    } catch (authError) {
      window.sessionStorage.removeItem("collexus-pending-account-type");
      setError(friendlyAuthError(authError));
    } finally {
      setBusy(false);
    }
  }

  async function signOutUser() {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    await supabase.auth.signOut();
    setMessage("You’re signed out.");
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <a className={styles.brand} href={`${basePath}/`} aria-label="Collexus home">
          <span className={styles.brandLogoFrame} aria-hidden="true"><img src={`${basePath}/collexus-logo.svg`} alt="" /></span>
          <span>Collexus</span>
        </a>
        <a className={styles.backLink} href={`${basePath}/#featured-events`}><ArrowLeft size={16} aria-hidden="true" /> Back to events</a>
      </header>

      <div className={styles.shell}>
        <section className={styles.authCard} aria-label="Account sign in and registration">
          <div className={styles.cardTopline}><span className={styles.cardIcon}><KeyRound size={17} aria-hidden="true" /></span><span>SECURE ACCOUNT ACCESS</span><span className={styles.secureBadge}><ShieldCheck size={13} aria-hidden="true" /> Encrypted sign-in</span></div>

          {user && mode !== "recovery" ? (
            <div className={styles.signedIn}>
              <span className={styles.signedIcon}><BadgeCheck size={26} aria-hidden="true" /></span>
              <p className={styles.eyebrow}>{needsMobileNumber ? "ONE LAST STEP" : "YOU’RE SIGNED IN"}</p>
              <h2>{needsMobileNumber ? "Add your mobile number" : `Welcome${user.displayName ? `, ${user.displayName.split(" ")[0]}` : " back"}.`}</h2>
              <p className={styles.signedEmail}>{user.email ?? user.phone}</p>
              {needsMobileNumber ? (
                <>
                  <p className={styles.verifyNotice}>A mobile number is required to finish your Google signup. It will be saved as unverified contact information.</p>
                  {error && <p className={styles.error} role="alert">{error}</p>}
                  <form className={styles.form} onSubmit={submitRequiredMobileNumber}>
                    <label className={styles.field}><span>Mobile number <small>required · unverified contact info</small></span><div className={styles.inputWrap}><Phone size={16} aria-hidden="true" /><input autoComplete="tel" inputMode="tel" maxLength={20} name="phone" pattern="[+0-9() .-]{7,20}" placeholder="+91 98765 43210" required type="tel" disabled={busy} /></div></label>
                    <button className={styles.primaryButton} disabled={busy || !configured} type="submit">{busy ? "Please wait…" : "Save mobile number"}<ArrowRight size={17} aria-hidden="true" /></button>
                  </form>
                </>
              ) : (
                <>
                  {!user.contactVerified && <p className={styles.verifyNotice}>Verify your email or phone before using account features.</p>}
                  {user.accountType && <p className={styles.signedEmail}>Account type: {user.accountType}</p>}
                  {error && <p className={styles.error} role="alert">{error}</p>}
                  <a className={styles.primaryButton} href={`${basePath}/#featured-events`}>Explore events <ArrowRight size={17} aria-hidden="true" /></a>
                </>
              )}
              <button className={styles.textButton} onClick={() => void signOutUser()} type="button">Sign out</button>
            </div>
          ) : (
            <>
              <p className={styles.eyebrow}>{mode === "signin" ? "WELCOME BACK" : mode === "signup" ? "GET STARTED" : "ACCOUNT RECOVERY"}</p>
              <h2>{mode === "signin" ? "Sign in to Collexus" : mode === "signup" ? "Create your account" : "Choose a new password"}</h2>
              <p className={styles.cardIntro}>{mode === "recovery" ? "Use a new password you have not used here before." : "Choose your account type to get the right sign-in fields."}</p>

              {mode !== "recovery" && <div className={styles.accountTypes} role="group" aria-label="Choose account type">
                {accountTypes.map(({ id, label, detail, icon: Icon }) => (
                  <button
                    aria-pressed={accountType === id}
                    className={`${styles.accountType} ${accountType === id ? styles.accountTypeSelected : ""}`}
                    disabled={busy}
                    key={id}
                    onClick={() => { setAccountType(id); setError(""); }}
                    type="button"
                  >
                    <Icon size={18} aria-hidden="true" />
                    <span><strong>{label}</strong><small>{detail}</small></span>
                    <Check className={`${styles.typeCheck} ${accountType === id ? styles.typeCheckVisible : ""}`} size={16} aria-hidden="true" />
                  </button>
                ))}
              </div>}

              {mode !== "recovery" && <div className={styles.modeTabs} role="tablist" aria-label="Account action">
                <button aria-selected={mode === "signin"} className={mode === "signin" ? styles.modeActive : ""} disabled={busy} onClick={() => switchMode("signin")} role="tab" type="button">Sign in</button>
                <button aria-selected={mode === "signup"} className={mode === "signup" ? styles.modeActive : ""} disabled={busy} onClick={() => switchMode("signup")} role="tab" type="button">Create account</button>
              </div>}

              {mode !== "recovery" && <button className={styles.googleButton} disabled={busy || !configured} onClick={() => void continueWithGoogle()} type="button">
                <GoogleMark /><span>Continue with Google</span>
              </button>}
              {mode !== "recovery" && <div className={styles.divider}><span>{mode === "signup" ? "or sign up with email" : "or sign in with email"}</span></div>}

              <form className={styles.form} onSubmit={submitCredentials}>
                {mode === "signup" && <label className={styles.field}><span>Full name</span><div className={styles.inputWrap}><UsersRound size={16} aria-hidden="true" /><input autoComplete="name" maxLength={80} name="name" placeholder="Your name" required disabled={busy} /></div></label>}
                {mode === "signup" && accountType !== "guest" && <label className={styles.field}><span>{accountType === "student" ? "Student ID" : "Faculty ID"} <small>for profile reference</small></span><div className={styles.inputWrap}><BookOpenCheck size={16} aria-hidden="true" /><input autoComplete="off" maxLength={30} name="campusId" placeholder={accountType === "student" ? "e.g. 23CSP001" : "e.g. FAC001"} required disabled={busy} /></div></label>}
                {mode !== "recovery" && <label className={styles.field}><span>{accountType === "guest" ? "Email address" : "College email"}</span><div className={styles.inputWrap}><Mail size={16} aria-hidden="true" /><input autoComplete="email" maxLength={254} name="email" placeholder={accountType === "guest" ? "you@example.com" : "you@college.edu"} required type="email" /></div></label>}
                {mode === "signup" && <label className={styles.field}><span>Mobile number <small>required · unverified contact info</small></span><div className={styles.inputWrap}><Phone size={16} aria-hidden="true" /><input autoComplete="tel" inputMode="tel" maxLength={20} name="phone" pattern="[+0-9() .-]{7,20}" placeholder="+91 98765 43210" required type="tel" disabled={busy} /></div></label>}
                <label className={styles.field}><span>{mode === "recovery" ? "New password" : "Password"} {(mode === "signup" || mode === "recovery") && <small>at least 10 characters</small>}</span><div className={styles.inputWrap}><KeyRound size={16} aria-hidden="true" /><input autoComplete={mode === "signin" ? "current-password" : "new-password"} minLength={mode === "signin" ? undefined : 10} maxLength={128} name="password" placeholder={mode === "signin" ? "Enter your password" : "Create a strong password"} required type={showPassword ? "text" : "password"} /><button aria-label={showPassword ? "Hide password" : "Show password"} className={styles.passwordToggle} onClick={() => setShowPassword((value) => !value)} type="button">{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></div></label>
                {(mode === "signup" || mode === "recovery") && <label className={styles.field}><span>Confirm password</span><div className={styles.inputWrap}><KeyRound size={16} aria-hidden="true" /><input autoComplete="new-password" minLength={10} maxLength={128} name="passwordAgain" placeholder="Enter it again" required type={showPassword ? "text" : "password"} /></div></label>}
                {mode === "signup" && <label className={styles.remember}><input required type="checkbox" disabled={busy} /> I agree to use Collexus respectfully and keep my account details accurate.</label>}

                {error && <p className={styles.error} role="alert">{error}</p>}
                {message && <p className={styles.success} role="status">{message}</p>}
                {!configured && <p className={styles.setupNotice} role="status">Authentication needs a Supabase project URL and publishable key before sign-in is enabled.</p>}

                <button className={styles.primaryButton} disabled={busy || checkingSession || !configured} type="submit">
                  {busy ? "Please wait…" : mode === "signin" ? "Sign in" : mode === "signup" ? "Create account" : "Update password"}<ArrowRight size={17} aria-hidden="true" />
                </button>
              </form>
              {mode === "recovery" && <button className={styles.textButton} onClick={() => switchMode("signin")} type="button">Back to sign in</button>}
              {mode !== "recovery" && <p className={styles.roleNote}>Account type helps personalize your experience. Student and faculty status must be verified separately before it can grant campus access.</p>}
            </>
          )}
        </section>
      </div>
      <footer className={styles.footer}><span>© 2026 Collexus</span><span>Campus events, in one place.</span></footer>
    </main>
  );
}

function GoogleMark() {
  return <svg aria-hidden="true" className={styles.googleMark} viewBox="0 0 20 20"><path fill="#4285F4" d="M19.6 10.23c0-.68-.06-1.36-.18-2.02H10v3.83h5.38a4.6 4.6 0 0 1-1.99 3.02v2.48h3.22c1.89-1.74 2.99-4.3 2.99-7.31Z"/><path fill="#34A853" d="M10 20c2.7 0 4.97-.9 6.62-2.46l-3.22-2.48c-.9.6-2.05.96-3.4.96-2.61 0-4.82-1.76-5.61-4.12H1.07v2.56A10 10 0 0 0 10 20Z"/><path fill="#FBBC05" d="M4.39 11.9a6.03 6.03 0 0 1 0-3.8V5.54H1.07a10 10 0 0 0 0 8.92l3.32-2.56Z"/><path fill="#EA4335" d="M10 3.98c1.47 0 2.79.5 3.82 1.5l2.87-2.87C14.96.98 12.7 0 10 0a10 10 0 0 0-8.93 5.54l3.32 2.56C5.18 5.74 7.39 3.98 10 3.98Z"/></svg>;
}
