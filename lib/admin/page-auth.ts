import "server-only";

import { redirect } from "next/navigation";
import { ApiError } from "@/lib/backend/errors";
import { requireRole } from "@/lib/auth";

export type AdminPanelPath = "/admin/events/" | "/admin/stalls/" | "/admin/staff/";

export async function requireAdminPanel(destination: AdminPanelPath) {
  try {
    return (await requireRole("admin")).user;
  } catch (error) {
    const next = encodeURIComponent(destination);
    if (error instanceof ApiError && error.status === 401) redirect(`/admin/login/?next=${next}`);
    if (error instanceof ApiError && error.code === "MFA_REQUIRED") redirect(`/admin/mfa/?next=${next}`);
    if (error instanceof ApiError && error.status === 403) return null;
    throw error;
  }
}
