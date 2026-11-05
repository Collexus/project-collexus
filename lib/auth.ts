import "server-only";
import { cache } from "react";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { ApiError } from "@/lib/backend/errors";

export type AppRole = "student" | "admin" | "event_organizer" | "staff" | "stall_operator";

export const getAuthenticatedUser = cache(async () => {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new ApiError(401, "UNAUTHENTICATED", "Sign in to continue.");
  return user;
});

export async function requireRole(role: AppRole, options: { requireMfa?: boolean } = {}) {
  const user = await getAuthenticatedUser();
  const { getPrisma } = await import("@/lib/prisma");
  const prisma = getPrisma();
  if (role === "student") return { user, role };

  const assignment = await prisma.userRoleAssignment.findFirst({
    where: { userId: user.id, role, revokedAt: null },
    select: { role: true },
  });
  if (assignment) {
    const assignedRole = assignment.role as AppRole;
    if (assignedRole === "admin" && options.requireMfa !== false) await requireAdminMfa();
    return { user, role: assignedRole };
  }

  // Keep admins assigned before the additive multi-role migration working
  // during rollout. New assignments are always checked in user_role_assignments.
  const legacyAdmin = role === "admin"
    ? await prisma.userRole.findUnique({ where: { userId: user.id }, select: { role: true } })
    : null;
  if (legacyAdmin?.role === "admin") {
    if (options.requireMfa !== false) await requireAdminMfa();
    return { user, role: "admin" as const };
  }

  throw new ApiError(403, "FORBIDDEN", "You do not have permission to perform this action.");
}

async function requireAdminMfa() {
  const supabase = await createSupabaseServerClient();
  const [assurance, factors] = await Promise.all([
    supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
    supabase.auth.mfa.listFactors(),
  ]);
  if (assurance.error || factors.error) {
    throw new ApiError(503, "MFA_CHECK_FAILED", "Could not verify administrator authentication.");
  }
  if (assurance.data.currentLevel !== "aal2" || factors.data.totp.length === 0) {
    throw new ApiError(403, "MFA_REQUIRED", "Administrators must complete authenticator verification.");
  }
}

export async function requireEventStaff(eventSlug: string) {
  const { user } = await requireRole("staff");
  const { getPrisma } = await import("@/lib/prisma");
  const assignment = await getPrisma().staffEventAssignment.findUnique({
    where: { staffUserId_eventSlug: { staffUserId: user.id, eventSlug } },
    select: { revokedAt: true },
  });
  if (!assignment || assignment.revokedAt) {
    throw new ApiError(403, "EVENT_ASSIGNMENT_REQUIRED", "You are not assigned to this event.");
  }
  return { user, eventSlug };
}
