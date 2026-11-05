"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { adminRoleChangeSchema, adminStaffEventAssignmentSchema, adminSubmissionReviewSchema } from "@/lib/admin/schemas";
import { ApiError } from "@/lib/backend/errors";
import { getPrisma } from "@/lib/prisma";
import { events } from "@/data/events";

class AdminActionFailure extends Error {
  constructor(readonly code: string) {
    super(code);
  }
}

async function requireAdminAction() {
  try {
    return await requireRole("admin");
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) redirect("/admin/login/?next=%2Fadmin%2F");
    if (error instanceof ApiError && error.code === "MFA_REQUIRED") redirect("/admin/mfa/?next=%2Fadmin%2F");
    if (error instanceof ApiError && error.status === 403) redirect("/?admin=restricted");
    throw error;
  }
}

export async function reviewEventSubmission(formData: FormData) {
  const parsed = adminSubmissionReviewSchema.safeParse({
    submissionId: formData.get("submissionId"),
    decision: formData.get("decision"),
    note: formData.get("note") ?? "",
  });
  if (!parsed.success) redirect("/admin/?error=invalid-review#event-review");

  const { user } = await requireAdminAction();
  const prisma = getPrisma();
  let saveFailed = false;

  try {
    await prisma.$transaction(async (transaction) => {
      const updated = await transaction.eventSubmission.updateMany({
        where: { id: parsed.data.submissionId, status: "pending_review" },
        data: {
          status: parsed.data.decision,
          reviewNote: parsed.data.note || null,
          reviewedBy: user.id,
          reviewedAt: new Date(),
        },
      });
      if (updated.count !== 1) throw new Error("Submission is no longer pending review.");

      await transaction.adminAuditLog.create({
        data: {
          actorId: user.id,
          action: `event_submission.${parsed.data.decision}`,
          resourceType: "event_submission",
          resourceId: parsed.data.submissionId,
          previousValues: { status: "pending_review" },
          newValues: { status: parsed.data.decision, reviewNoteAdded: Boolean(parsed.data.note) },
        },
      });
    });
  } catch (error) {
    console.error(JSON.stringify({ level: "error", message: "Admin event submission review failed", errorName: error instanceof Error ? error.name : "UnknownError" }));
    saveFailed = true;
  }

  if (saveFailed) redirect("/admin/?error=review-failed#event-review");
  revalidatePath("/admin/");
  redirect("/admin/?notice=review-saved#event-review");
}

export async function changeAccountRole(formData: FormData) {
  const parsed = adminRoleChangeSchema.safeParse({
    userId: formData.get("userId"),
    role: formData.get("role"),
    operation: formData.get("operation"),
  });
  if (!parsed.success) redirect("/admin/?error=invalid-role#accounts");

  const { user } = await requireAdminAction();
  if (parsed.data.userId === user.id && parsed.data.role === "admin" && parsed.data.operation === "revoke") {
    redirect("/admin/?error=self-admin-revoke#accounts");
  }

  const prisma = getPrisma();
  let errorCode = "";

  try {
    await prisma.$transaction(async (transaction) => {
      const current = await transaction.userRoleAssignment.findUnique({
        where: { userId_role: { userId: parsed.data.userId, role: parsed.data.role } },
        select: { revokedAt: true },
      });
      const active = current?.revokedAt === null;
      if (parsed.data.operation === "revoke" && !active) throw new AdminActionFailure("role-not-active");

      if (parsed.data.operation === "revoke" && parsed.data.role === "admin" && active) {
        const activeAdminCount = await transaction.userRoleAssignment.count({ where: { role: "admin", revokedAt: null } });
        if (activeAdminCount <= 1) throw new AdminActionFailure("last-admin");
      }

      if (parsed.data.operation === "assign") {
        await transaction.userRoleAssignment.upsert({
          where: { userId_role: { userId: parsed.data.userId, role: parsed.data.role } },
          create: { userId: parsed.data.userId, role: parsed.data.role, assignedBy: user.id },
          update: { assignedBy: user.id, revokedAt: null },
        });
        if (parsed.data.role === "admin") {
          await transaction.userRole.upsert({
            where: { userId: parsed.data.userId },
            create: { userId: parsed.data.userId, role: "admin" },
            update: { role: "admin" },
          });
        }
      } else {
        await transaction.userRoleAssignment.updateMany({
          where: { userId: parsed.data.userId, role: parsed.data.role, revokedAt: null },
          data: { revokedAt: new Date() },
        });
        if (parsed.data.role === "admin") {
          await transaction.userRole.updateMany({
            where: { userId: parsed.data.userId, role: "admin" },
            data: { role: "user" },
          });
        }
        if (parsed.data.role === "staff") {
          const activeEventAssignments = await transaction.staffEventAssignment.findMany({
            where: { staffUserId: parsed.data.userId, revokedAt: null },
            select: { id: true, eventSlug: true },
          });
          await transaction.staffEventAssignment.updateMany({
            where: { staffUserId: parsed.data.userId, revokedAt: null },
            data: { revokedAt: new Date() },
          });
          if (activeEventAssignments.length > 0) {
            await transaction.adminAuditLog.createMany({
              data: activeEventAssignments.map((assignment) => ({
                actorId: user.id,
                action: "staff_event_assignment.revoke",
                resourceType: "staff_event_assignment",
                resourceId: assignment.id,
                previousValues: { active: true },
                newValues: { active: false, eventSlug: assignment.eventSlug, reason: "staff_role_revoked" },
              })),
            });
          }
        }
      }

      await transaction.adminAuditLog.create({
        data: {
          actorId: user.id,
          action: `role.${parsed.data.operation}`,
          resourceType: "user_role",
          resourceId: parsed.data.userId,
          previousValues: { role: parsed.data.role, active },
          newValues: { role: parsed.data.role, active: parsed.data.operation === "assign" },
        },
      });
    }, { isolationLevel: "Serializable" });
  } catch (error) {
    if (error instanceof AdminActionFailure) errorCode = error.code;
    else {
      console.error(JSON.stringify({ level: "error", message: "Admin role assignment failed", errorName: error instanceof Error ? error.name : "UnknownError" }));
      errorCode = "role-change-failed";
    }
  }

  if (errorCode) redirect(`/admin/?error=${errorCode}#accounts`);
  revalidatePath("/admin/");
  redirect("/admin/?notice=role-updated#accounts");
}

export async function changeStaffEventAssignment(formData: FormData) {
  const parsed = adminStaffEventAssignmentSchema.safeParse({
    userId: formData.get("userId"),
    eventSlug: formData.get("eventSlug"),
    operation: formData.get("operation"),
  });
  if (!parsed.success || !events.some((event) => event.slug === parsed.data.eventSlug)) {
    redirect("/admin/?error=invalid-staff-assignment#accounts");
  }

  const { user } = await requireAdminAction();
  const prisma = getPrisma();
  let errorCode = "";

  try {
    await prisma.$transaction(async (transaction) => {
      const staffRole = await transaction.userRoleAssignment.findUnique({
        where: { userId_role: { userId: parsed.data.userId, role: "staff" } },
        select: { revokedAt: true },
      });
      if (parsed.data.operation === "assign" && staffRole?.revokedAt !== null) {
        throw new AdminActionFailure("staff-role-required");
      }

      const current = await transaction.staffEventAssignment.findUnique({
        where: { staffUserId_eventSlug: { staffUserId: parsed.data.userId, eventSlug: parsed.data.eventSlug } },
        select: { id: true, revokedAt: true },
      });
      const active = current?.revokedAt === null;
      if (parsed.data.operation === "revoke" && !active) throw new AdminActionFailure("staff-assignment-not-active");

      let assignmentId: string;
      if (parsed.data.operation === "assign") {
        const saved = await transaction.staffEventAssignment.upsert({
          where: { staffUserId_eventSlug: { staffUserId: parsed.data.userId, eventSlug: parsed.data.eventSlug } },
          create: { staffUserId: parsed.data.userId, eventSlug: parsed.data.eventSlug, assignedBy: user.id },
          update: { assignedBy: user.id, revokedAt: null },
          select: { id: true },
        });
        assignmentId = saved.id;
      } else {
        await transaction.staffEventAssignment.update({
          where: { staffUserId_eventSlug: { staffUserId: parsed.data.userId, eventSlug: parsed.data.eventSlug } },
          data: { revokedAt: new Date() },
        });
        assignmentId = current!.id;
      }

      await transaction.adminAuditLog.create({
        data: {
          actorId: user.id,
          action: `staff_event_assignment.${parsed.data.operation}`,
          resourceType: "staff_event_assignment",
          resourceId: assignmentId,
          previousValues: { active },
          newValues: { active: parsed.data.operation === "assign", userId: parsed.data.userId, eventSlug: parsed.data.eventSlug },
        },
      });
    }, { isolationLevel: "Serializable" });
  } catch (error) {
    if (error instanceof AdminActionFailure) errorCode = error.code;
    else {
      console.error(JSON.stringify({ level: "error", message: "Admin staff assignment failed", errorName: error instanceof Error ? error.name : "UnknownError" }));
      errorCode = "staff-assignment-failed";
    }
  }

  if (errorCode) redirect(`/admin/?error=${errorCode}#accounts`);
  revalidatePath("/admin/");
  redirect("/admin/?notice=staff-assignment-updated#accounts");
}
