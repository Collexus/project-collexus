import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { requireRole } from "@/lib/auth";
import { ApiError } from "@/lib/backend/errors";
import { safeAdminDestination } from "@/lib/admin/auth-schemas";
import { AdminMfaPanel } from "./admin-mfa-panel";
import styles from "./admin-mfa.module.css";

export const metadata: Metadata = {
  title: "Administrator verification",
  description: "Set up or verify your administrator authenticator.",
  robots: { index: false, follow: false },
};

type AdminMfaPageProps = {
  searchParams: Promise<{ next?: string | string[] }>;
};

export default async function AdminMfaPage({ searchParams }: AdminMfaPageProps) {
  const params = await searchParams;
  const destination = safeAdminDestination(Array.isArray(params.next) ? undefined : params.next);
  let userEmail = "";
  let factors: { id: string; name: string; status: "verified" | "unverified" }[] = [];
  let alreadyVerified = false;

  try {
    const { user } = await requireRole("admin", { requireMfa: false });
    userEmail = user.email ?? "";

    const supabase = await createSupabaseServerClient();
    const [assurance, factorList] = await Promise.all([
      supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
      supabase.auth.mfa.listFactors(),
    ]);
    if (assurance.error || factorList.error) {
      throw new ApiError(503, "MFA_STATUS_UNAVAILABLE", "Could not check administrator authentication status.");
    }

    alreadyVerified = assurance.data.currentLevel === "aal2";
    factors = factorList.data.all
      .filter((factor) => factor.factor_type === "totp")
      .map((factor) => ({
        id: factor.id,
        name: factor.friendly_name || "Authenticator app",
        status: factor.status,
      }));
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      redirect("/admin/login/?next=%2Fadmin%2F");
    }
    if (error instanceof ApiError && error.status === 403) {
      redirect("/?admin=restricted");
    }

    return (
      <main className={styles.page}>
        <section className={styles.card}>
          <p className={styles.eyebrow}>COLLEXUS ADMIN SECURITY</p>
          <h1>Verification is unavailable</h1>
          <p>We could not confirm your administrator account. Check the server authentication and database configuration, then try again.</p>
          <a className={styles.secondaryButton} href="/admin/login/">Return to admin sign in</a>
        </section>
      </main>
    );
  }

  if (alreadyVerified) redirect(destination);

  return <AdminMfaPanel destination={destination} email={userEmail} factors={factors} />;
}
