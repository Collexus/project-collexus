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
  MessageCircle,
  Phone,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import { getSupabaseClient, isSupabaseConfigured } from "../../lib/supabase-client";
import { updateUserProfile, type AccountType } from "../../lib/user-profile";
import styles from "./login.module.css";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

type AccountMode = "signin" | "signup" | "recovery";
type PhoneAuthStep = "details" | "verify";
type EmailAuthPurpose = "signin" | "signup";
type SignupDetails = { fullName: string; campusId: string; email: string };
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
  if (code === "phone_exists" || code === "email_exists" || code === "user_already_exists" || normalized.includes("phone number already registered") || normalized.includes("email address already registered")) return "An account already exists for this address. Choose Sign in and request an email code.";
  if (code === "otp_expired") return "This code has expired. Request a new code and try again.";
  if (code === "otp_invalid" || code === "token_not_found" || code === "invalid_credentials") return "That code or sign-in detail is not valid. Check it and try again.";
  if (code === "user_not_found") return "No account was found for these details. Create an account with your college email, or check your sign-in method.";
  if (code === "over_email_send_rate_limit") return "Email delivery is temporarily limited for this project. Wait for the limit to reset, or ask the site administrator to configure custom SMTP.";
  if (code === "over_request_rate_limit") return "Supabase temporarily limited sign-up requests from this network. Wait a few minutes before trying again, and avoid repeated retries.";
  if (code === "over_sms_send_rate_limit") return "WhatsApp code delivery is temporarily limited by Supabase. Wait for the rate limit to reset before requesting another code.";
  if (code === "sms_send_failed" || code === "phone_provider_disabled" || normalized.includes("twilio") || normalized.includes("whatsapp provider")) return "Supabase could not send the WhatsApp code. Check that Phone auth and the Twilio WhatsApp sender are enabled in the Supabase project.";
  if (details.status === 429) return "Supabase temporarily limited this authentication request. Wait a few minutes before trying again.";
  if (normalized.includes("rate limit") || normalized.includes("too many")) return "Too many attempts. Wait a little and try again.";
  if (normalized.includes("already registered") || normalized.includes("already exists")) return "That account may already exist. Try signing in or use another email address.";
  if (normalized.includes("email not confirmed")) return "Verify your email with the one-time code we sent before signing in.";
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
  const [phoneAuthPurpose, setPhoneAuthPurpose] = useState<"signin" | null>(null);
  const [phoneAuthStep, setPhoneAuthStep] = useState<PhoneAuthStep>("details");
  const [phoneOtp, setPhoneOtp] = useState("");
  const [pendingPhone, setPendingPhone] = useState("");
  const [emailAuthPurpose, setEmailAuthPurpose] = useState<EmailAuthPurpose | null>(null);
  const [emailAuthStep, setEmailAuthStep] = useState<PhoneAuthStep>("details");
  const [emailOtp, setEmailOtp] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");
  const [pendingSignup, setPendingSignup] = useState<SignupDetails | null>(null);
  const [resendSeconds, setResendSeconds] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [user, setUser] = useState<AuthUser | null>(null);
  const [needsMobileNumber, setNeedsMobileNumber] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [configured, setConfigured] = useState(false);

  useEffect(() => {
    if (!resendSeconds) return;
    const timer = window.setTimeout(() => setResendSeconds((seconds) => Math.max(0, seconds - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [resendSeconds]);

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
              email: currentUser.email ?? (typeof currentUser.user_metadata.personal_email === "string" ? currentUser.user_metadata.personal_email : null),
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
    if (nextMode === "signup") window.sessionStorage.removeItem("collexus-pending-account-type");
    setPhoneAuthPurpose(null);
    setPhoneAuthStep("details");
    setPhoneOtp("");
    setPendingPhone("");
    setEmailAuthPurpose(null);
    setEmailAuthStep("details");
    setEmailOtp("");
    setPendingEmail("");
    setPendingSignup(null);
    setResendSeconds(0);
    setError("");
    setMessage("");
  }

  function startWhatsAppSignIn() {
    setPhoneAuthPurpose("signin");
    setPhoneAuthStep("details");
    setPhoneOtp("");
    setResendSeconds(0);
    setPendingSignup(null);
    setEmailAuthPurpose(null);
    setEmailAuthStep("details");
    setEmailOtp("");
    setPendingEmail("");
    setError("");
    setMessage("");
  }

  function useEmailSignIn() {
    setPhoneAuthPurpose(null);
    setPhoneAuthStep("details");
    setPhoneOtp("");
    setPendingPhone("");
    setPendingSignup(null);
    setEmailAuthPurpose(null);
    setEmailAuthStep("details");
    setEmailOtp("");
    setPendingEmail("");
    setResendSeconds(0);
    setError("");
    setMessage("");
  }

  async function sendWhatsAppCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setBusy(true);
    const formData = new FormData(event.currentTarget);
    const phone = normalizePhoneNumber(String(formData.get("phone") ?? ""));

    try {
      const supabase = getSupabaseClient();
      if (!supabase) {
        setError("Secure sign-in is not configured yet. Add the Supabase project URL and publishable key first.");
        return;
      }
      if (!isInternationalPhoneNumber(phone)) {
        setError("Enter your mobile number with its country code, for example +91 98765 43210.");
        return;
      }

      const { error: otpError } = await supabase.auth.signInWithOtp({
        phone,
        options: {
          channel: "whatsapp",
          shouldCreateUser: false,
        },
      });
      if (otpError) throw otpError;
      setPendingPhone(phone);
      setPhoneOtp("");
      setPhoneAuthStep("verify");
      setResendSeconds(60);
      setMessage("A WhatsApp code is on its way. Enter it below to sign in.");
    } catch (authError) {
      setError(friendlyAuthError(authError));
    } finally {
      setBusy(false);
    }
  }

  async function resendWhatsAppCode() {
    if (!pendingPhone || resendSeconds > 0) return;
    setError("");
    setMessage("");
    setBusy(true);
    try {
      const supabase = getSupabaseClient();
      if (!supabase) throw new Error("Supabase is not configured.");
      const { error: otpError } = await supabase.auth.signInWithOtp({
        phone: pendingPhone,
        options: { channel: "whatsapp", shouldCreateUser: false },
      });
      if (otpError) throw otpError;
      setResendSeconds(60);
      setMessage("A new WhatsApp code is on its way.");
    } catch (authError) {
      setError(friendlyAuthError(authError));
    } finally {
      setBusy(false);
    }
  }

  async function verifyWhatsAppCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    const token = phoneOtp.trim();
    if (!/^\d{6}$/.test(token)) {
      setError("Enter the 6-digit code sent to your WhatsApp.");
      return;
    }
    setBusy(true);
    try {
      const supabase = getSupabaseClient();
      if (!supabase || !pendingPhone) {
        setError("Your code request has expired. Start again to get a new code.");
        return;
      }
      const { data, error: verifyError } = await supabase.auth.verifyOtp({ phone: pendingPhone, token, type: "sms" });
      if (verifyError) throw verifyError;
      if (!data.session || !data.user?.phone_confirmed_at) {
        setError("Supabase did not confirm this phone number. Check the code or request a new one.");
        return;
      }
      window.sessionStorage.removeItem("collexus-pending-account-type");
      window.location.assign(`${basePath}/profile/`);
    } catch (authError) {
      setError(friendlyAuthError(authError));
    } finally {
      setBusy(false);
    }
  }

  async function sendEmailCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    setBusy(true);
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const isSignup = mode === "signup";
    try {
      const supabase = getSupabaseClient();
      if (!supabase) {
        setError("Secure sign-in is not configured yet. Add the Supabase project URL and publishable key first.");
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setError("Enter a valid college email address.");
        return;
      }
      let signup: SignupDetails | null = null;
      if (isSignup) {
        const fullName = String(formData.get("name") ?? "").trim();
        const campusId = String(formData.get("campusId") ?? "").trim();
        if (!fullName) {
          setError("Enter your full name to create your account.");
          return;
        }
        signup = { fullName, campusId, email };
        window.sessionStorage.removeItem("collexus-pending-account-type");
      }
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email,
        options: {
          shouldCreateUser: isSignup,
          ...(signup ? { data: {
            full_name: signup.fullName,
            account_type: accountType,
            campus_id: signup.campusId || null,
          } } : {}),
        },
      });
      if (otpError) throw otpError;
      setPendingEmail(email);
      setPendingSignup(signup);
      setEmailAuthPurpose(isSignup ? "signup" : "signin");
      setEmailAuthStep("verify");
      setEmailOtp("");
      setResendSeconds(60);
      setMessage(`A 6-digit code is on its way to ${email}.`);
    } catch (authError) {
      setError(friendlyAuthError(authError));
    } finally {
      setBusy(false);
    }
  }

  async function resendEmailCode() {
    if (!pendingEmail || !emailAuthPurpose || resendSeconds > 0) return;
    setError("");
    setMessage("");
    setBusy(true);
    try {
      const supabase = getSupabaseClient();
      if (!supabase) throw new Error("Supabase is not configured.");
      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: pendingEmail,
        options: {
          shouldCreateUser: emailAuthPurpose === "signup",
          ...(pendingSignup ? { data: {
            full_name: pendingSignup.fullName,
            account_type: accountType,
            campus_id: pendingSignup.campusId || null,
          } } : {}),
        },
      });
      if (otpError) throw otpError;
      setResendSeconds(60);
      setMessage(`A new 6-digit code is on its way to ${pendingEmail}.`);
    } catch (authError) {
      setError(friendlyAuthError(authError));
    } finally {
      setBusy(false);
    }
  }

  async function verifyEmailCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    const token = emailOtp.trim();
    if (!/^\d{6}$/.test(token)) {
      setError("Enter the 6-digit code sent to your college email.");
      return;
    }
    setBusy(true);
    try {
      const supabase = getSupabaseClient();
      if (!supabase || !pendingEmail) {
        setError("Your code request has expired. Start again to get a new code.");
        return;
      }
      const { data, error: verifyError } = await supabase.auth.verifyOtp({ email: pendingEmail, token, type: "email" });
      if (verifyError) throw verifyError;
      if (!data.session || !data.user?.email_confirmed_at) {
        setError("Supabase did not confirm this email. Check the code or request a new one.");
        return;
      }
      window.sessionStorage.removeItem("collexus-pending-account-type");
      window.location.assign(`${basePath}/profile/`);
    } catch (authError) {
      setError(friendlyAuthError(authError));
    } finally {
      setBusy(false);
    }
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

      const { data, error: signinError } = await supabase.auth.signInWithPassword({ email, password });
      if (signinError) throw signinError;
      if (!data.user.email_confirmed_at) {
        await supabase.auth.signOut();
        setError("Verify your email with the one-time code before signing in.");
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
                    <label className={styles.field}><span>Mobile number <small>required · unverified contact info</small></span><div className={styles.inputWrap}><Phone size={16} aria-hidden="true" /><input autoComplete="tel" defaultValue="+91 " inputMode="tel" maxLength={20} name="phone" pattern="[+0-9() .-]{7,20}" placeholder="+91 98765 43210" required type="tel" disabled={busy} /></div></label>
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
              <p className={styles.cardIntro}>{mode === "recovery" ? "Use a new password you have not used here before." : mode === "signup" ? "Create your account with a one-time code sent to your college email." : "Choose your account type to get the right sign-in fields."}</p>

              {mode !== "recovery" && <div className={styles.accountTypes} role="group" aria-label="Choose account type">
                {accountTypes.map(({ id, label, detail, icon: Icon }) => (
                  <button
                    aria-pressed={accountType === id}
                    className={`${styles.accountType} ${accountType === id ? styles.accountTypeSelected : ""}`}
                    disabled={busy || (phoneAuthPurpose !== null && phoneAuthStep === "verify") || emailAuthStep === "verify"}
                    key={id}
                    onClick={() => { setAccountType(id); setPendingSignup((current) => current ? { ...current, campusId: "" } : current); setError(""); }}
                    type="button"
                  >
                    <Icon size={18} aria-hidden="true" />
                    <span><strong>{label}</strong><small>{detail}</small></span>
                    <Check className={`${styles.typeCheck} ${accountType === id ? styles.typeCheckVisible : ""}`} size={16} aria-hidden="true" />
                  </button>
                ))}
              </div>}

              {mode !== "recovery" && <div className={styles.modeTabs} role="tablist" aria-label="Account action">
                <button aria-selected={mode === "signin"} className={mode === "signin" ? styles.modeActive : ""} disabled={busy || (phoneAuthPurpose !== null && phoneAuthStep === "verify") || emailAuthStep === "verify"} onClick={() => switchMode("signin")} role="tab" type="button">Sign in</button>
                <button aria-selected={mode === "signup"} className={mode === "signup" ? styles.modeActive : ""} disabled={busy || (phoneAuthPurpose !== null && phoneAuthStep === "verify") || emailAuthStep === "verify"} onClick={() => switchMode("signup")} role="tab" type="button">Create account</button>
              </div>}

              {mode === "signin" && phoneAuthPurpose === null && emailAuthStep === "details" && <>
                <button className={styles.googleButton} disabled={busy || !configured} onClick={() => void continueWithGoogle()} type="button">
                  <GoogleMark /><span>Continue with Google</span>
                </button>
                <div className={styles.divider}><span>sign in with your college email</span></div>
                <form className={styles.form} onSubmit={sendEmailCode}>
                  <label className={styles.field}><span>College email</span><div className={styles.inputWrap}><Mail size={16} aria-hidden="true" /><input autoComplete="email" defaultValue={pendingEmail} maxLength={254} name="email" placeholder="name@college.edu" required type="email" disabled={busy} /></div><small className={styles.fieldHelp}>We’ll send a one-time sign-in code to this inbox.</small></label>
                  {error && <p className={styles.error} role="alert">{error}</p>}
                  {message && <p className={styles.success} role="status">{message}</p>}
                  {!configured && <p className={styles.setupNotice} role="status">Authentication needs a Supabase project URL and publishable key before sign-in is enabled.</p>}
                  <button className={styles.primaryButton} disabled={busy || checkingSession || !configured} type="submit">{busy ? "Sending code…" : "Send email code"}<ArrowRight size={17} aria-hidden="true" /></button>
                </form>
                <form className={styles.form} onSubmit={submitCredentials}>
                  <div className={styles.divider}><span>or use your password</span></div>
                  <label className={styles.field}><span>Email address</span><div className={styles.inputWrap}><Mail size={16} aria-hidden="true" /><input autoComplete="email" maxLength={254} name="email" placeholder="you@example.com" required type="email" /></div></label>
                  <label className={styles.field}><span>Password</span><div className={styles.inputWrap}><KeyRound size={16} aria-hidden="true" /><input autoComplete="current-password" maxLength={128} name="password" placeholder="Enter your password" required type={showPassword ? "text" : "password"} /><button aria-label={showPassword ? "Hide password" : "Show password"} className={styles.passwordToggle} onClick={() => setShowPassword((value) => !value)} type="button">{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></div></label>
                  {error && <p className={styles.error} role="alert">{error}</p>}
                  {message && <p className={styles.success} role="status">{message}</p>}
                  {!configured && <p className={styles.setupNotice} role="status">Authentication needs a Supabase project URL and publishable key before sign-in is enabled.</p>}
                  <button className={styles.primaryButton} disabled={busy || checkingSession || !configured} type="submit">{busy ? "Please wait…" : "Sign in with password"}<ArrowRight size={17} aria-hidden="true" /></button>
                </form>
                <button className={styles.textButton} disabled={busy || !configured} onClick={startWhatsAppSignIn} type="button">Sign in with an existing WhatsApp account</button>
              </>}

              {mode === "signup" && emailAuthStep === "details" && <>
                <div className={styles.divider}><span>verify your college email to create an account</span></div>
                <form className={styles.form} onSubmit={sendEmailCode}>
                  <label className={styles.field}><span>Full name</span><div className={styles.inputWrap}><UsersRound size={16} aria-hidden="true" /><input autoComplete="name" defaultValue={pendingSignup?.fullName ?? ""} maxLength={80} name="name" placeholder="Your name" required disabled={busy} /></div></label>
                  {accountType !== "guest" && <label className={styles.field}><span>{accountType === "student" ? "Student ID" : "Faculty ID"} <small>for profile reference</small></span><div className={styles.inputWrap}><BookOpenCheck size={16} aria-hidden="true" /><input autoComplete="off" defaultValue={pendingSignup?.campusId ?? ""} maxLength={30} name="campusId" placeholder={accountType === "student" ? "e.g. 23CSP001" : "e.g. FAC001"} required disabled={busy} /></div></label>}
                  <label className={styles.field}><span>College email</span><div className={styles.inputWrap}><Mail size={16} aria-hidden="true" /><input autoComplete="email" defaultValue={pendingSignup?.email ?? ""} maxLength={254} name="email" placeholder="name@college.edu" required type="email" disabled={busy} /></div><small className={styles.fieldHelp}>Use an inbox you can access. Your sign-in code will be sent here.</small></label>
                  <label className={styles.remember}><input name="agreement" required type="checkbox" disabled={busy} /> I agree to use Collexus respectfully and keep my account details accurate.</label>
                  {error && <p className={styles.error} role="alert">{error}</p>}
                  {message && <p className={styles.success} role="status">{message}</p>}
                  {!configured && <p className={styles.setupNotice} role="status">Authentication needs a Supabase project URL and publishable key before sign-in is enabled.</p>}
                  <button className={styles.primaryButton} disabled={busy || checkingSession || !configured} type="submit">{busy ? "Sending code…" : "Send email code"}<ArrowRight size={17} aria-hidden="true" /></button>
                </form>
              </>}

              {emailAuthStep === "verify" && emailAuthPurpose && <>
                <div className={styles.divider}><span>code sent to {pendingEmail}</span></div>
                <form className={styles.form} onSubmit={verifyEmailCode}>
                  <label className={styles.field}><span>6-digit email code</span><div className={styles.inputWrap}><Mail size={16} aria-hidden="true" /><input autoComplete="one-time-code" autoFocus inputMode="numeric" maxLength={6} name="otp" onChange={(event) => setEmailOtp(event.target.value.replace(/\D/g, "").slice(0, 6))} pattern="[0-9]{6}" placeholder="Enter the code" required value={emailOtp} disabled={busy} /></div></label>
                  {error && <p className={styles.error} role="alert">{error}</p>}
                  {message && <p className={styles.success} role="status">{message}</p>}
                  <button className={styles.primaryButton} disabled={busy || checkingSession || !configured} type="submit">{busy ? "Checking code…" : emailAuthPurpose === "signup" ? "Verify email and create account" : "Verify and sign in"}<ArrowRight size={17} aria-hidden="true" /></button>
                </form>
                <button className={styles.textButton} disabled={busy} onClick={() => { setEmailAuthPurpose(null); setEmailAuthStep("details"); setEmailOtp(""); setPendingEmail(""); setPendingSignup(null); setResendSeconds(0); setError(""); setMessage(""); }} type="button">Change email or details</button>
                <button className={styles.textButton} disabled={busy || resendSeconds > 0} onClick={() => void resendEmailCode()} type="button">{resendSeconds > 0 ? `Resend code in ${resendSeconds}s` : "Resend email code"}</button>
              </>}

              {mode === "signin" && phoneAuthPurpose === "signin" && phoneAuthStep === "details" && <>
                <div className={styles.divider}><span>sign in with an existing WhatsApp account</span></div>
                <form className={styles.form} onSubmit={sendWhatsAppCode}>
                  <label className={styles.field}><span>Mobile number</span><div className={styles.inputWrap}><Phone size={16} aria-hidden="true" /><input autoComplete="tel" defaultValue={pendingPhone || "+91 "} inputMode="tel" maxLength={20} name="phone" pattern="[+0-9() .-]{7,20}" placeholder="+91 98765 43210" required type="tel" disabled={busy} /></div><small className={styles.fieldHelp}>We’ll send a sign-in code over WhatsApp.</small></label>
                  {error && <p className={styles.error} role="alert">{error}</p>}
                  {message && <p className={styles.success} role="status">{message}</p>}
                  <button className={styles.primaryButton} disabled={busy || checkingSession || !configured} type="submit">{busy ? "Sending code…" : "Send WhatsApp code"}<ArrowRight size={17} aria-hidden="true" /></button>
                </form>
                <button className={styles.textButton} disabled={busy} onClick={useEmailSignIn} type="button">Use college email instead</button>
              </>}

              {mode === "signin" && phoneAuthPurpose === "signin" && phoneAuthStep === "verify" && <>
                <div className={styles.divider}><span>code sent to {pendingPhone}</span></div>
                <form className={styles.form} onSubmit={verifyWhatsAppCode}>
                  <label className={styles.field}><span>6-digit WhatsApp code</span><div className={styles.inputWrap}><MessageCircle size={16} aria-hidden="true" /><input autoComplete="one-time-code" autoFocus inputMode="numeric" maxLength={6} name="otp" onChange={(event) => setPhoneOtp(event.target.value.replace(/\D/g, "").slice(0, 6))} pattern="[0-9]{6}" placeholder="Enter the code" required value={phoneOtp} disabled={busy} /></div></label>
                  {error && <p className={styles.error} role="alert">{error}</p>}
                  {message && <p className={styles.success} role="status">{message}</p>}
                  <button className={styles.primaryButton} disabled={busy || checkingSession || !configured} type="submit">{busy ? "Checking code…" : "Verify and sign in"}<ArrowRight size={17} aria-hidden="true" /></button>
                </form>
                <button className={styles.textButton} disabled={busy} onClick={() => { setPhoneAuthStep("details"); setPhoneOtp(""); setError(""); setMessage(""); }} type="button">Change number</button>
                <button className={styles.textButton} disabled={busy || resendSeconds > 0} onClick={() => void resendWhatsAppCode()} type="button">{resendSeconds > 0 ? `Resend code in ${resendSeconds}s` : "Resend WhatsApp code"}</button>
              </>}

              {mode === "recovery" && <form className={styles.form} onSubmit={submitCredentials}>
                <label className={styles.field}><span>Email address</span><div className={styles.inputWrap}><Mail size={16} aria-hidden="true" /><input autoComplete="email" maxLength={254} name="email" placeholder="you@example.com" required type="email" /></div></label>
                <label className={styles.field}><span>New password <small>at least 10 characters</small></span><div className={styles.inputWrap}><KeyRound size={16} aria-hidden="true" /><input autoComplete="new-password" minLength={10} maxLength={128} name="password" placeholder="Create a strong password" required type={showPassword ? "text" : "password"} /><button aria-label={showPassword ? "Hide password" : "Show password"} className={styles.passwordToggle} onClick={() => setShowPassword((value) => !value)} type="button">{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></div></label>
                <label className={styles.field}><span>Confirm password</span><div className={styles.inputWrap}><KeyRound size={16} aria-hidden="true" /><input autoComplete="new-password" minLength={10} maxLength={128} name="passwordAgain" placeholder="Enter it again" required type={showPassword ? "text" : "password"} /></div></label>
                {error && <p className={styles.error} role="alert">{error}</p>}
                {message && <p className={styles.success} role="status">{message}</p>}
                {!configured && <p className={styles.setupNotice} role="status">Authentication needs a Supabase project URL and publishable key before sign-in is enabled.</p>}
                <button className={styles.primaryButton} disabled={busy || checkingSession || !configured} type="submit">{busy ? "Please wait…" : "Update password"}<ArrowRight size={17} aria-hidden="true" /></button>
              </form>}
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
