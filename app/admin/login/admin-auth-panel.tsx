"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { ArrowLeft, ArrowRight, Eye, EyeOff, KeyRound, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { CollexusHomeLogo } from "@/components/collexus-home-logo";
import { TurnstileChallenge, turnstileSiteKey } from "../../login/turnstile-challenge";
import authStyles from "../../login/login.module.css";
import { getSupabaseClient, isSupabaseConfigured } from "../../../lib/supabase-client";
import { adminEmailOtpSchema, adminEmailSchema, adminSignInSchema, adminSignUpSchema } from "../../../lib/admin/auth-schemas";
import styles from "./admin-login.module.css";

const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/$/, "");
const passwordResetEmailStorageKey = "collexus-admin-password-reset-email";

type AdminAuthMode = "signin" | "signup" | "forgot" | "verify-reset" | "reset";

function authErrorMessage(error: { code?: string; status?: number }) {
  if (["user_already_exists", "email_exists", "duplicate_email"].includes(error.code ?? "")) return "An account already exists for this email. Sign in or choose Forgot password.";
  if (error.code === "captcha_failed") return "Cloudflare could not verify this request. Complete the security check again.";
  if (error.code === "invalid_credentials") return "Supabase did not accept these credentials for the configured project. Confirm this account exists there and its email is verified; if it does, choose Forgot password to reset it.";
  if (error.code === "email_not_confirmed") return "Verify your email from the message Supabase sent, then sign in again.";
  if (error.code === "signup_disabled" || error.code === "email_provider_disabled") return "Email signup is disabled for this Supabase project. Enable the Email provider to create an account.";
  if (error.code === "weak_password") return "Choose a stronger password and try again.";
  if (error.status === 429 || error.code?.includes("rate_limit")) return "Too many attempts. Wait a little and try again.";
  return "We could not complete that request. Check the email and password, then try again.";
}

export function AdminAuthPanel({ destination }: { destination: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<AdminAuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [emailOtpStep, setEmailOtpStep] = useState(false);
  const [signupEmail, setSignupEmail] = useState("");
  const [emailOtp, setEmailOtp] = useState("");
  const [passwordResetOtp, setPasswordResetOtp] = useState("");
  const [resendSeconds, setResendSeconds] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [invalidCredentials, setInvalidCredentials] = useState(false);
  const [notice, setNotice] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const [captchaError, setCaptchaError] = useState("");
  const [captchaResetKey, setCaptchaResetKey] = useState(0);

  const saveCaptchaToken = useCallback((token: string) => setCaptchaToken(token), []);
  const saveCaptchaError = useCallback((message: string) => setCaptchaError(message), []);

  useEffect(() => {
    if (resendSeconds <= 0) return;
    const timer = window.setTimeout(() => setResendSeconds((seconds) => Math.max(0, seconds - 1)), 1000);
    return () => window.clearTimeout(timer);
  }, [resendSeconds]);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const recoveryIntent = searchParams.get("flow") === "recovery"
      || searchParams.get("type") === "recovery"
      || hashParams.get("type") === "recovery";
    const recoveryError = searchParams.get("error_code") ?? hashParams.get("error_code");
    if (recoveryIntent && recoveryError) {
      const timer = window.setTimeout(() => {
        setMode("forgot");
        setError("This password reset link has expired or has already been used. Request a fresh link below.");
      }, 0);
      return () => window.clearTimeout(timer);
    }

    const hasAuthCallback = window.location.hash.includes("access_token=")
      || searchParams.has("code");
    if (!hasAuthCallback) {
      // Keep the code-entry step visible if the browser reloads while the user checks email.
      const pendingResetEmail = window.sessionStorage.getItem(passwordResetEmailStorageKey);
      if (!pendingResetEmail || !adminEmailSchema.safeParse(pendingResetEmail).success) return;
      const timer = window.setTimeout(() => {
        setEmail(pendingResetEmail);
        setMode("verify-reset");
      }, 0);
      return () => window.clearTimeout(timer);
    }

    const supabase = getSupabaseClient();
    if (!supabase) return;

    let active = true;
    let recoveryCallback = recoveryIntent || window.location.hash.includes("type=recovery");
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === "PASSWORD_RECOVERY" || (event === "SIGNED_IN" && recoveryCallback)) && active) {
        recoveryCallback = true;
        setEmail(session?.user.email ?? "");
        setMode("reset");
        setError("");
        setNotice("Choose a new password to restore access to your admin account.");
      }
    });
    void supabase.auth.getSession().then(({ data }) => {
      if (!active || !data.session?.user.email_confirmed_at) return;
      if (recoveryCallback) {
        setEmail(data.session.user.email ?? "");
        setMode("reset");
        setNotice("Choose a new password to restore access to your admin account.");
      } else {
        router.replace("/admin/mfa/?next=" + encodeURIComponent(destination));
        router.refresh();
      }
    });
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [destination, router]);

  function switchMode(nextMode: AdminAuthMode) {
    if (nextMode !== "verify-reset" && nextMode !== "reset") {
      window.sessionStorage.removeItem(passwordResetEmailStorageKey);
    }
    setMode(nextMode);
    setPassword("");
    setConfirmPassword("");
    setShowPassword(false);
    setEmailOtpStep(false);
    setEmailOtp("");
    setPasswordResetOtp("");
    setSignupEmail("");
    setResendSeconds(0);
    setError("");
    setInvalidCredentials(false);
    setNotice("");
    setCaptchaToken("");
    setCaptchaError("");
    setCaptchaResetKey((value) => value + 1);
  }

  function returnToSignup() {
    setEmailOtpStep(false);
    setEmailOtp("");
    setError("");
    setNotice("");
    setCaptchaToken("");
    setCaptchaError("");
    setCaptchaResetKey((value) => value + 1);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setInvalidCredentials(false);
    setNotice("");

    if (!isSupabaseConfigured() || !getSupabaseClient()) {
      setError("Supabase Auth is not configured. Add the public project URL and publishable key, then restart the app.");
      return;
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      setError("Supabase Auth is not configured. Add the public project URL and publishable key, then restart the app.");
      return;
    }

    if (mode === "reset") {
      const parsed = adminSignUpSchema.safeParse({ email, password, confirmPassword });
      if (!parsed.success) {
        setError(parsed.error.issues[0]?.message ?? "Check the form and try again.");
        return;
      }
      setBusy(true);
      try {
        const { error: updateError } = await supabase.auth.updateUser({ password: parsed.data.password });
        if (updateError) {
          setError(authErrorMessage(updateError));
          return;
        }
        await supabase.auth.signOut();
        window.sessionStorage.removeItem(passwordResetEmailStorageKey);
        setMode("signin");
        setPassword("");
        setConfirmPassword("");
        setEmailOtpStep(false);
        setCaptchaToken("");
        setCaptchaError("");
        setCaptchaResetKey((value) => value + 1);
        setNotice("Your password has been updated. Sign in with your new password.");
        window.history.replaceState(null, "", window.location.pathname);
      } catch {
        setError("We could not update your password. The reset link may have expired; request a new one and try again.");
      } finally {
        setBusy(false);
      }
      return;
    }

    const parsedEmail = adminEmailSchema.safeParse(email);
    if (!parsedEmail.success) {
      setError(parsedEmail.error.issues[0]?.message ?? "Enter a valid email address.");
      return;
    }
    const parsedCredentials = mode === "signin"
      ? adminSignInSchema.safeParse({ email: parsedEmail.data, password })
      : mode === "signup"
        ? adminSignUpSchema.safeParse({ email: parsedEmail.data, password, confirmPassword })
        : null;
    if (parsedCredentials && !parsedCredentials.success) {
      setError(parsedCredentials.error.issues[0]?.message ?? "Check the form and try again.");
      return;
    }

    if (!turnstileSiteKey) {
      setError("Cloudflare security verification is not configured. Contact the Collexus administrator.");
      return;
    }
    if (!captchaToken) {
      setError(captchaError || "Complete the Cloudflare security check to continue.");
      return;
    }

    const submittedToken = captchaToken;
    setBusy(true);
    try {
      if (mode === "forgot") {
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(parsedEmail.data, {
          redirectTo: `${window.location.origin}${basePath}/admin/login/?flow=recovery`,
          captchaToken: submittedToken,
        });
        if (resetError) {
          setError(authErrorMessage(resetError));
          return;
        }
        setPasswordResetOtp("");
        window.sessionStorage.setItem(passwordResetEmailStorageKey, parsedEmail.data);
        setMode("verify-reset");
        setNotice("If an account exists for this email, a six-digit password reset code is on its way. Enter it below.");
        return;
      }

      if (mode === "signin") {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: parsedEmail.data,
          password,
          options: { captchaToken: submittedToken },
        });
        if (signInError) {
          if (signInError.code === "email_not_confirmed") {
            setSignupEmail(parsedEmail.data);
            setEmailOtp("");
            setEmailOtpStep(true);
            setResendSeconds(0);
            setNotice("This account needs email confirmation. Enter the 6-digit code sent to " + parsedEmail.data + ".");
            return;
          }
          setInvalidCredentials(signInError.code === "invalid_credentials");
          setError(authErrorMessage(signInError));
          return;
        }

        router.replace("/admin/mfa/?next=" + encodeURIComponent(destination));
        router.refresh();
        return;
      }

      if (!parsedCredentials?.success || mode !== "signup") return;
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: parsedCredentials.data.email,
        password: parsedCredentials.data.password,
        options: {
          captchaToken: submittedToken,
          emailRedirectTo: `${window.location.origin}${basePath}/admin/login/`,
        },
      });
      if (signUpError) {
        setError(authErrorMessage(signUpError));
        return;
      }

      setSignupEmail(parsedCredentials.data.email);
      setPassword("");
      setConfirmPassword("");
      if (signUpData.session) {
        router.replace("/admin/mfa/?next=" + encodeURIComponent(destination));
        router.refresh();
        return;
      }
      setEmailOtp("");
      setEmailOtpStep(true);
      setResendSeconds(60);
      setNotice("If an account already exists for this email, sign in or choose Forgot password. If signup is available, check for the 6-digit confirmation code.");
    } catch {
      setError("Connection interrupted. Check your internet and try again.");
    } finally {
      setBusy(false);
      setCaptchaToken("");
      setCaptchaError("");
      setCaptchaResetKey((value) => value + 1);
    }
  }

  async function verifySignupEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");

    const parsed = adminEmailOtpSchema.safeParse(emailOtp);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Enter the 6-digit code from your email.");
      return;
    }

    const supabase = getSupabaseClient();
    if (!supabase || !signupEmail) {
      setError("Your confirmation request expired. Return to signup and try again.");
      return;
    }

    setBusy(true);
    try {
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email: signupEmail,
        token: parsed.data,
        type: "email",
      });
      if (verifyError) {
        if (verifyError.code === "otp_expired" || verifyError.code === "invalid_otp") {
          setError("That code is incorrect or expired. Check your email or request a new code.");
        } else {
          setError(authErrorMessage(verifyError));
        }
        return;
      }
      if (!data.session || !data.user?.email_confirmed_at) {
        setError("Supabase did not confirm this email. Check the code or request a new one.");
        return;
      }

      router.replace("/admin/mfa/?next=" + encodeURIComponent(destination));
      router.refresh();
    } catch {
      setError("We could not verify that code. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  async function verifyPasswordResetCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");

    const parsed = adminEmailOtpSchema.safeParse(passwordResetOtp);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Enter the 6-digit password reset code from your email.");
      return;
    }

    const supabase = getSupabaseClient();
    if (!supabase || !email) {
      setError("Your reset request expired. Request a new password reset code and try again.");
      return;
    }

    setBusy(true);
    try {
      const { data, error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: parsed.data,
        type: "recovery",
      });
      if (verifyError) {
        if (verifyError.code === "otp_expired" || verifyError.code === "invalid_otp") {
          setError("That reset code is incorrect, expired, or already used. Request a fresh code and try again.");
        } else {
          setError(authErrorMessage(verifyError));
        }
        return;
      }
      if (!data.session || !data.user?.email_confirmed_at) {
        setError("Supabase did not verify this reset code. Request a new code and try again.");
        return;
      }

      window.sessionStorage.removeItem(passwordResetEmailStorageKey);
      setPasswordResetOtp("");
      setMode("reset");
      setNotice("Reset code verified. Choose a new password for your admin account.");
    } catch {
      setError("We could not verify that reset code. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  async function resendSignupEmailCode() {
    if (!signupEmail || resendSeconds > 0) return;
    setError("");
    setNotice("");

    if (!captchaToken) {
      setError(captchaError || "Complete the Cloudflare security check before requesting another code.");
      return;
    }
    const supabase = getSupabaseClient();
    if (!supabase) {
      setError("Supabase Auth is not configured. Contact the Collexus administrator.");
      return;
    }

    setBusy(true);
    try {
      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email: signupEmail,
        options: {
          captchaToken,
          emailRedirectTo: window.location.origin + basePath + "/admin/login/",
        },
      });
      if (resendError) {
        setError(authErrorMessage(resendError));
        return;
      }
      setEmailOtp("");
      setResendSeconds(60);
      setNotice("A new confirmation code is on its way to " + signupEmail + ".");
    } catch {
      setError("We could not resend the code. Check your connection and try again.");
    } finally {
      setBusy(false);
      setCaptchaToken("");
      setCaptchaError("");
      setCaptchaResetKey((value) => value + 1);
    }
  }

  return (
    <main className={authStyles.page} id="main-content" tabIndex={-1}>
      <header className={authStyles.header}>
        <Link aria-label="Collexus home" className={`${authStyles.brand} ${styles.brand}`} href="/">
          <CollexusHomeLogo basePath={basePath} />
        </Link>
        <Link className={authStyles.backLink} href="/"><ArrowLeft size={16} aria-hidden="true" /> Public site</Link>
      </header>

      <div className={`${authStyles.shell} ${styles.shell}`}>
        <section aria-labelledby="admin-auth-title" className={`${authStyles.authCard} ${styles.card}`}>
          <div className={authStyles.cardTopline}>
            <span className={authStyles.cardIcon}><LockKeyhole size={16} aria-hidden="true" /></span>
            <span>COLLEXUS ADMIN WORKSPACE</span>
            <span className={authStyles.secureBadge}><ShieldCheck size={13} aria-hidden="true" /> Protected access</span>
          </div>

          {emailOtpStep ? (
            <>
              <p className={authStyles.eyebrow}><span /> VERIFY YOUR EMAIL</p>
              <h1 className={styles.title} id="admin-auth-title">Check your email</h1>
              <p className={authStyles.cardIntro + " " + styles.intro}>If signup is available for {signupEmail}, enter the 6-digit confirmation code from your email to continue.</p>
              <TurnstileChallenge
                errorMessage={captchaError}
                onError={saveCaptchaError}
                onToken={saveCaptchaToken}
                resetKey={captchaResetKey}
                tokenReady={Boolean(captchaToken)}
              />
              {notice && <p className={authStyles.success} aria-live="polite" role="status">{notice}</p>}
              <form className={authStyles.form + " " + styles.form} onSubmit={verifySignupEmail}>
                <label className={authStyles.field} htmlFor="admin-email-otp">
                  <span>6-digit email code</span>
                  <span className={authStyles.inputWrap}>
                    <Mail size={16} aria-hidden="true" />
                    <input
                      autoComplete="one-time-code"
                      autoFocus
                      id="admin-email-otp"
                      inputMode="numeric"
                      maxLength={6}
                      onChange={(event) => setEmailOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
                      pattern="[0-9]{6}"
                      placeholder="Enter the code"
                      required
                      type="text"
                      value={emailOtp}
                    />
                  </span>
                </label>
                {error && <p className={authStyles.error} id="admin-auth-error" role="alert">{error}</p>}
                <button className={authStyles.primaryButton} disabled={busy} type="submit">
                  {busy ? "Verifying…" : "Verify email and continue"}
                  <ArrowRight size={17} aria-hidden="true" />
                </button>
              </form>
              <button className={authStyles.textButton} disabled={busy || resendSeconds > 0 || !captchaToken} onClick={() => void resendSignupEmailCode()} type="button">
                {resendSeconds > 0 ? "Resend code in " + resendSeconds + "s" : "Resend confirmation code"}
              </button>
              <button className={authStyles.textButton} disabled={busy} onClick={returnToSignup} type="button">Back to signup</button>
              <button className={authStyles.textButton} disabled={busy} onClick={() => switchMode("signin")} type="button">Already have an account? Sign in</button>
            </>
          ) : mode === "verify-reset" ? (
            <>
              <p className={authStyles.eyebrow}><span /> ADMINISTRATOR ACCESS</p>
              <h1 className={styles.title} id="admin-auth-title">Enter your reset code</h1>
              <p className={`${authStyles.cardIntro} ${styles.intro}`}>
                Enter the six-digit password reset code sent to {email}. This keeps email security scanners from consuming your reset link.
              </p>
              <button className={authStyles.textButton} disabled={busy} onClick={() => switchMode("forgot")} type="button">Request another code</button>
              {notice && <p className={authStyles.success} aria-live="polite" role="status">{notice}</p>}
              <form className={`${authStyles.form} ${styles.form}`} onSubmit={verifyPasswordResetCode}>
                <label className={authStyles.field} htmlFor="admin-password-reset-code">
                  <span>6-digit reset code</span>
                  <span className={authStyles.inputWrap}>
                    <Mail size={16} aria-hidden="true" />
                    <input
                      autoComplete="one-time-code"
                      autoFocus
                      id="admin-password-reset-code"
                      inputMode="numeric"
                      maxLength={6}
                      onChange={(event) => setPasswordResetOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
                      pattern="[0-9]{6}"
                      placeholder="Enter the code"
                      required
                      type="text"
                      value={passwordResetOtp}
                    />
                  </span>
                </label>
                {error && <p className={authStyles.error} id="admin-auth-error" role="alert">{error}</p>}
                <button className={authStyles.primaryButton} disabled={busy} type="submit">
                  {busy ? "Verifying…" : "Verify reset code"}
                  <ArrowRight size={17} aria-hidden="true" />
                </button>
              </form>
              <p className={styles.standardLogin}><Link href="/login/">Use standard Collexus sign-in</Link></p>
            </>
          ) : (
            <>
          <p className={authStyles.eyebrow}><span /> ADMINISTRATOR ACCESS</p>
          <h1 className={styles.title} id="admin-auth-title">
            {mode === "signin" ? "Sign in to the admin workspace" : mode === "signup" ? "Create an account" : mode === "forgot" ? "Reset your password" : "Choose a new password"}
          </h1>
          <p className={`${authStyles.cardIntro} ${styles.intro}`}>
            {mode === "signin"
              ? "After password sign-in, complete the required authenticator check. Administrator access is confirmed securely on the server."
              : mode === "signup"
                ? "Create a Collexus account, verify your email, then have a trusted administrator assign workspace access."
                : mode === "forgot"
                  ? "Enter your email and we’ll send a six-digit reset code if an account is registered with it."
                  : "Set a new password for your admin account, then sign in and complete the authenticator check."}
          </p>

          {(mode === "signin" || mode === "signup") ? (
            <div aria-label="Admin account action" className={authStyles.modeTabs} role="group">
              <button aria-pressed={mode === "signin"} className={mode === "signin" ? authStyles.modeActive : ""} disabled={busy} onClick={() => switchMode("signin")} type="button">Sign in</button>
              <button aria-pressed={mode === "signup"} className={mode === "signup" ? authStyles.modeActive : ""} disabled={busy} onClick={() => switchMode("signup")} type="button">Create account</button>
            </div>
          ) : (
            <button className={authStyles.textButton} disabled={busy} onClick={() => switchMode("signin")} type="button">Back to sign in</button>
          )}

          {(mode === "signin" || mode === "signup") && <div className={styles.roleNotice}>
            <ShieldCheck size={17} aria-hidden="true" />
            <p>Creating an account never grants administrator privileges. Admin roles are assigned separately and recorded by the server.</p>
          </div>}

          {mode !== "reset" && <TurnstileChallenge
              errorMessage={captchaError}
              onError={saveCaptchaError}
              onToken={saveCaptchaToken}
              resetKey={captchaResetKey}
              tokenReady={Boolean(captchaToken)}
            />}

          <form className={`${authStyles.form} ${styles.form}`} onSubmit={submit}>
            {mode !== "reset" && <label className={authStyles.field} htmlFor="admin-email">
              <span>Email address</span>
              <span className={authStyles.inputWrap}><Mail size={16} aria-hidden="true" /><input autoComplete="email" id="admin-email" maxLength={254} onChange={(event) => setEmail(event.target.value)} required type="email" value={email} /></span>
            </label>}
            {(mode === "signin" || mode === "signup" || mode === "reset") && <label className={authStyles.field} htmlFor="admin-password">
              <span>{mode === "reset" ? "New password" : "Password"} <small>{mode !== "signin" ? "at least 10 characters" : ""}</small></span>
              <span className={authStyles.inputWrap}>
                <KeyRound size={16} aria-hidden="true" />
                <input autoComplete={mode === "signin" ? "current-password" : "new-password"} id="admin-password" maxLength={128} minLength={10} onChange={(event) => setPassword(event.target.value)} required type={showPassword ? "text" : "password"} value={password} />
                <button aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword} className={authStyles.passwordToggle} onClick={() => setShowPassword((value) => !value)} type="button">{showPassword ? <EyeOff size={16} aria-hidden="true" /> : <Eye size={16} aria-hidden="true" />}</button>
              </span>
            </label>}

            {(mode === "signup" || mode === "reset") && <label className={authStyles.field} htmlFor="admin-confirm-password">
              <span>Confirm password</span>
              <span className={authStyles.inputWrap}><KeyRound size={16} aria-hidden="true" /><input autoComplete="new-password" id="admin-confirm-password" maxLength={128} minLength={10} onChange={(event) => setConfirmPassword(event.target.value)} required type={showPassword ? "text" : "password"} value={confirmPassword} /></span>
            </label>}

            {error && <p className={authStyles.error} id="admin-auth-error" role="alert">{error}</p>}
            {invalidCredentials && mode === "signin" && <button className={authStyles.textButton} disabled={busy} onClick={() => switchMode("forgot")} type="button">Reset password with this email</button>}
            {notice && <p className={authStyles.success} aria-live="polite" role="status">{notice}</p>}

            <button className={authStyles.primaryButton} disabled={busy || !isSupabaseConfigured()} type="submit">
              {busy ? "Please wait…" : mode === "signin" ? "Sign in securely" : mode === "signup" ? "Create account" : mode === "forgot" ? "Send reset code" : "Update password"}
              <ArrowRight size={17} aria-hidden="true" />
            </button>
          </form>

          {mode === "signin" && <button className={authStyles.textButton} disabled={busy} onClick={() => switchMode("forgot")} type="button">Forgot password?</button>}

          {(mode === "signin" || mode === "signup") && <p className={`${authStyles.roleNote} ${styles.footerNote}`}>
            Need the first administrator? After the account is verified and the database migration is applied, use the first-admin setup in the admin guide.
          </p>}
          <p className={styles.standardLogin}><Link href="/login/">Use standard Collexus sign-in</Link></p>
            </>
          )}
        </section>
      </div>

      <footer className={`${authStyles.footer} ${styles.footer}`}><span>Collexus administration</span><span>Session and role checks run on the server.</span></footer>
    </main>
  );
}
