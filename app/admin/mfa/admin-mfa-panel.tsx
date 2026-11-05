"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, KeyRound, LockKeyhole, ShieldCheck } from "lucide-react";
import { CollexusHomeLogo } from "@/components/collexus-home-logo";
import { getSupabaseClient } from "@/lib/supabase-client";
import { adminMfaCodeSchema } from "@/lib/admin/auth-schemas";
import authStyles from "../../login/login.module.css";
import styles from "./admin-mfa.module.css";

type AuthenticatorFactor = { id: string; name: string; status: "verified" | "unverified" };
type Enrollment = { qrCode: string; secret: string };
const basePath = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/$/, "");

function getMfaErrorMessage(error: unknown) {
  const code = typeof error === "object" && error !== null && "code" in error && typeof error.code === "string"
    ? error.code
    : "";

  if (code === "mfa_totp_enroll_not_enabled") {
    return "Authenticator setup is disabled in Supabase. Enable TOTP enrollment and verification in the project's Auth settings.";
  }
  if (code === "mfa_verification_failed" || code === "mfa_invalid_code") {
    return "That code was not accepted. Check your authenticator and try the current 6-digit code.";
  }
  return "We could not complete verification. Try again, or contact the project administrator.";
}

export function AdminMfaPanel({
  destination,
  email,
  factors: initialFactors,
}: {
  destination: string;
  email: string;
  factors: AuthenticatorFactor[];
}) {
  const router = useRouter();
  const [factors] = useState(initialFactors);
  const [factorId, setFactorId] = useState(initialFactors.find((factor) => factor.status === "verified")?.id ?? initialFactors[0]?.id ?? "");
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [loadingEnrollment, setLoadingEnrollment] = useState(initialFactors.length === 0);
  const [error, setError] = useState("");
  const enrollmentStarted = useRef(false);

  const startEnrollment = useCallback(async () => {
    if (enrollmentStarted.current) return;
    enrollmentStarted.current = true;
    setLoadingEnrollment(true);
    setError("");

    const supabase = getSupabaseClient();
    if (!supabase) {
      enrollmentStarted.current = false;
      setLoadingEnrollment(false);
      setError("Supabase Auth is not configured. Contact the project administrator.");
      return;
    }

    try {
      const { data, error: enrollError } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "Collexus administrator",
      });
      if (enrollError) throw enrollError;
      setEnrollment({ qrCode: data.totp.qr_code, secret: data.totp.secret });
      setFactorId(data.id);
    } catch (enrollError) {
      enrollmentStarted.current = false;
      setError(getMfaErrorMessage(enrollError));
    } finally {
      setLoadingEnrollment(false);
    }
  }, []);

  useEffect(() => {
    if (initialFactors.length === 0) {
      const timer = window.setTimeout(() => void startEnrollment(), 0);
      return () => window.clearTimeout(timer);
    }
  }, [initialFactors.length, startEnrollment]);

  async function verify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const parsed = adminMfaCodeSchema.safeParse(code);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Enter your 6-digit authenticator code.");
      return;
    }
    if (!factorId) {
      setError("Choose an authenticator and try again.");
      return;
    }

    const supabase = getSupabaseClient();
    if (!supabase) {
      setError("Supabase Auth is not configured. Contact the project administrator.");
      return;
    }

    setBusy(true);
    try {
      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId });
      if (challengeError) throw challengeError;

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.id,
        code: parsed.data,
      });
      if (verifyError) throw verifyError;

      router.replace(destination);
      router.refresh();
    } catch (verifyError) {
      setError(getMfaErrorMessage(verifyError));
      setCode("");
    } finally {
      setBusy(false);
    }
  }

  const hasVerifiedFactor = factors.some((factor) => factor.status === "verified");
  const isSetup = !hasVerifiedFactor;
  const needsNewEnrollment = factors.length === 0;
  const qrImage = enrollment
    ? "data:image/svg+xml;utf-8," + encodeURIComponent(enrollment.qrCode)
    : "";

  return (
    <main className={authStyles.page} id="main-content" tabIndex={-1}>
      <header className={authStyles.header}>
        <Link aria-label="Collexus home" className={authStyles.brand + " " + styles.brand} href="/">
          <CollexusHomeLogo basePath={basePath} />
        </Link>
        <Link className={authStyles.backLink} href="/"><ArrowLeft size={16} aria-hidden="true" /> Public site</Link>
      </header>

      <div className={authStyles.shell + " " + styles.shell}>
        <section aria-labelledby="admin-mfa-title" className={authStyles.authCard + " " + styles.card}>
          <div className={authStyles.cardTopline}>
            <span className={authStyles.cardIcon}><LockKeyhole size={16} aria-hidden="true" /></span>
            <span>COLLEXUS ADMIN WORKSPACE</span>
            <span className={authStyles.secureBadge}><ShieldCheck size={13} aria-hidden="true" /> Two-step verification</span>
          </div>

          <p className={authStyles.eyebrow}><span /> ADMINISTRATOR SECURITY</p>
          <h1 className={styles.title} id="admin-mfa-title">{needsNewEnrollment ? "Set up your authenticator" : isSetup ? "Finish authenticator setup" : "Verify your sign in"}</h1>
          <p className={authStyles.cardIntro + " " + styles.intro}>
            {needsNewEnrollment
              ? "Admin accounts must register an authenticator app before entering the workspace."
              : isSetup
                ? "Use the authenticator app you started setting up, then enter its current code to finish."
                : "Enter the current 6-digit code from your authenticator app to continue."}
          </p>
          {email && <p className={styles.accountEmail}>Signed in as <strong>{email}</strong></p>}

          {needsNewEnrollment && (
            <div className={styles.setupSteps}>
              <p><span>1</span> Open an authenticator app such as Google Authenticator, Microsoft Authenticator, 1Password, or Apple Passwords.</p>
              <p><span>2</span> Scan this QR code, then enter the 6-digit code the app generates.</p>
            </div>
          )}

          {needsNewEnrollment && loadingEnrollment && <p className={styles.loading} role="status">Preparing your secure authenticator…</p>}
          {needsNewEnrollment && enrollment && (
            <div className={styles.qrPanel}>
              <Image alt="QR code for the Collexus administrator authenticator" className={styles.qrCode} height={208} src={qrImage} unoptimized width={208} />
              <details className={styles.manualSetup}>
                <summary>Can’t scan the code? Enter the setup key</summary>
                <code>{enrollment.secret}</code>
              </details>
            </div>
          )}
          {needsNewEnrollment && error && !enrollment && (
            <>
              <p className={authStyles.error} role="alert">{error}</p>
              <button className={styles.retryButton} disabled={busy} onClick={() => void startEnrollment()} type="button">Try authenticator setup again</button>
            </>
          )}

          {factors.length > 1 && (
            <label className={authStyles.field + " " + styles.factorField} htmlFor="admin-authenticator">
              <span>Authenticator</span>
              <select id="admin-authenticator" onChange={(event) => setFactorId(event.target.value)} value={factorId}>
                {factors.map((factor) => <option key={factor.id} value={factor.id}>{factor.name}{factor.status === "unverified" ? " (setup pending)" : ""}</option>)}
              </select>
            </label>
          )}

          {(!needsNewEnrollment || enrollment) && (
            <form className={authStyles.form + " " + styles.form} onSubmit={verify}>
              <label className={authStyles.field} htmlFor="admin-mfa-code">
                <span>{needsNewEnrollment ? "Authenticator code" : "6-digit code"}</span>
                <span className={authStyles.inputWrap}>
                  <KeyRound size={16} aria-hidden="true" />
                  <input
                    autoComplete="one-time-code"
                    autoFocus
                    id="admin-mfa-code"
                    inputMode="numeric"
                    maxLength={6}
                    onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
                    pattern="[0-9]{6}"
                    placeholder="000000"
                    required
                    type="text"
                    value={code}
                  />
                </span>
              </label>
              {error && <p className={authStyles.error} role="alert">{error}</p>}
              <button className={authStyles.primaryButton} disabled={busy || loadingEnrollment} type="submit">
                {busy ? "Verifying…" : needsNewEnrollment ? "Enable authenticator" : isSetup ? "Finish setup" : "Verify and continue"}
                <ArrowRight size={17} aria-hidden="true" />
              </button>
            </form>
          )}

          <p className={authStyles.roleNote + " " + styles.footerNote}>
            Your authenticator is checked by Supabase Auth. Admin pages and actions require a verified second factor.
          </p>
          <Link className={styles.signInLink} href="/admin/login/">Return to admin sign in</Link>
        </section>
      </div>

      <footer className={authStyles.footer + " " + styles.footer}><span>Collexus administration</span><span>Keep your authenticator device private.</span></footer>
    </main>
  );
}
