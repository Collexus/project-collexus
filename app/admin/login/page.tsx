import type { Metadata } from "next";
import { AdminAuthPanel } from "./admin-auth-panel";
import { safeAdminDestination } from "@/lib/admin/auth-schemas";

export const metadata: Metadata = {
  title: "Administrator sign in",
  description: "Sign in or create a Collexus account for administrator access.",
  robots: { index: false, follow: false },
};

type AdminLoginPageProps = {
  searchParams: Promise<{ next?: string | string[] }>;
};

export default async function AdminLoginPage({ searchParams }: AdminLoginPageProps) {
  const params = await searchParams;
  const next = Array.isArray(params.next) ? undefined : params.next;

  return <AdminAuthPanel destination={safeAdminDestination(next)} />;
}
