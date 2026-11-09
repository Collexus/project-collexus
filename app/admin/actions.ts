"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { adminRoleChangeSchema, adminStaffEventAssignmentSchema, adminStallSubmissionReviewSchema, adminSubmissionReviewSchema } from "@/lib/admin/schemas";
import { ApiError } from "@/lib/backend/errors";
import { getPrisma } from "@/lib/prisma";
import { events } from "@/data/events";
import { randomUUID } from "node:crypto";
import { Prisma } from "@/lib/generated/prisma/client";
import { stallRegistrationSubmissionSchema } from "@/lib/backend/schemas";
import {
  adminFoodMenuItemAvailabilitySchema,
  adminFoodMenuItemCreateSchema,
  adminFoodStallCreateSchema,
  adminFoodStallOperatorAssignmentSchema,
  adminFoodStallUpdateSchema,
} from "@/lib/admin/schemas";

class AdminActionFailure extends Error {
  constructor(readonly code: string) {
    super(code);
  }
}

type AdminReturnPath = "/admin/" | "/admin/events/" | "/admin/staff/" | "/admin/stalls/";

function getAdminReturnPath(formData: FormData): AdminReturnPath {
  const value = formData.get("returnTo");
  return value === "/admin/events/" || value === "/admin/staff/" || value === "/admin/stalls/" ? value : "/admin/";
}

function adminAnchor(path: AdminReturnPath) {
  if (path === "/admin/events/") return "event-requests";
  if (path === "/admin/staff/") return "staff-list";
  if (path === "/admin/stalls/") return "stall-list";
  return "accounts";
}

function redirectAdminMessage(path: AdminReturnPath, parameter: "error" | "notice", code: string): never {
  redirect(`${path}?${parameter}=${encodeURIComponent(code)}#${adminAnchor(path)}`);
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
  const returnTo = getAdminReturnPath(formData) === "/admin/events/" ? "/admin/events/" : "/admin/";
  const parsed = adminSubmissionReviewSchema.safeParse({
    submissionId: formData.get("submissionId"),
    decision: formData.get("decision"),
    note: formData.get("note") ?? "",
  });
  if (!parsed.success) redirectAdminMessage(returnTo, "error", "invalid-review");

  const { user } = await requireAdminAction();
  const prisma = getPrisma();
  let saveFailed = false;

  try {
    await prisma.$transaction(async (transaction) => {
      const submission = await transaction.eventSubmission.findUnique({
        where: { id: parsed.data.submissionId },
        select: { organizerId: true, status: true },
      });
      if (!submission || submission.status !== "pending_review") throw new Error("Submission is no longer pending review.");
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

      if (parsed.data.decision === "approved") {
        const previousRole = await transaction.userRoleAssignment.findUnique({
          where: { userId_role: { userId: submission.organizerId, role: "event_organizer" } },
          select: { revokedAt: true },
        });
        await transaction.userRoleAssignment.upsert({
          where: { userId_role: { userId: submission.organizerId, role: "event_organizer" } },
          create: { userId: submission.organizerId, role: "event_organizer", assignedBy: user.id },
          update: { assignedBy: user.id, revokedAt: null },
        });
        await transaction.adminAuditLog.create({
          data: {
            actorId: user.id,
            action: "role.assign",
            resourceType: "user_role",
            resourceId: submission.organizerId,
            previousValues: { role: "event_organizer", active: previousRole?.revokedAt === null },
            newValues: { role: "event_organizer", active: true, sourceSubmissionId: parsed.data.submissionId },
          },
        });
      }

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

  if (saveFailed) redirectAdminMessage(returnTo, "error", "review-failed");
  revalidatePath(returnTo);
  revalidatePath("/admin/");
  revalidatePath("/event-panel/");
  redirectAdminMessage(returnTo, "notice", "review-saved");
}

function priceToPaise(value: string) {
  const [rupees, paise = ""] = value.split(".");
  return Number(rupees) * 100 + Number(paise.padEnd(2, "0"));
}

export async function reviewStallSubmission(formData: FormData) {
  const returnTo = "/admin/stalls/";
  const parsed = adminStallSubmissionReviewSchema.safeParse({
    submissionId: formData.get("submissionId"),
    decision: formData.get("decision"),
    note: formData.get("note") ?? "",
  });
  if (!parsed.success) redirectAdminMessage(returnTo, "error", "invalid-stall-review");

  const { user } = await requireAdminAction();
  let errorCode = "";
  try {
    await getPrisma().$transaction(async (transaction) => {
      const submission = await transaction.stallSubmission.findUnique({
        where: { id: parsed.data.submissionId },
        select: { id: true, submitterId: true, requestData: true, status: true, createdStallId: true },
      });
      if (!submission || submission.status !== "pending_review") throw new AdminActionFailure("stall-review-not-pending");
      let createdStallId: string | null = null;

      if (parsed.data.decision === "approved") {
        const request = stallRegistrationSubmissionSchema.parse(submission.requestData);
        const eventName = request.stall.eventName === "Other / not listed" ? request.stall.customEventName : request.stall.eventName;
        const linkedEvent = events.find((event) => event.title === eventName);
        const stall = await transaction.foodStall.create({
          data: {
            name: request.stall.name,
            slug: slugifyStallName(request.stall.name),
            category: request.stall.category,
            eventSlug: linkedEvent?.slug ?? null,
            description: request.stall.setupNotes || null,
            status: "draft",
          },
          select: { id: true, name: true, category: true, eventSlug: true },
        });
        createdStallId = stall.id;
        if (request.menuItems.length) {
          await transaction.foodMenuItem.createMany({
            data: request.menuItems.map((item) => ({
              stallId: stall.id,
              name: item.name,
              description: `Offer price: ₹${item.offerPrice}`,
              pricePaise: priceToPaise(item.eventDayPrice),
            })),
          });
        }

        const previousRole = await transaction.userRoleAssignment.findUnique({
          where: { userId_role: { userId: submission.submitterId, role: "stall_operator" } },
          select: { revokedAt: true },
        });
        await transaction.userRoleAssignment.upsert({
          where: { userId_role: { userId: submission.submitterId, role: "stall_operator" } },
          create: { userId: submission.submitterId, role: "stall_operator", assignedBy: user.id },
          update: { assignedBy: user.id, revokedAt: null },
        });
        const assignment = await transaction.foodStallOperatorAssignment.upsert({
          where: { stallId_userId: { stallId: stall.id, userId: submission.submitterId } },
          create: { stallId: stall.id, userId: submission.submitterId, assignedBy: user.id },
          update: { assignedBy: user.id, revokedAt: null },
          select: { id: true },
        });
        await transaction.adminAuditLog.create({
          data: {
            actorId: user.id,
            action: "role.assign",
            resourceType: "user_role",
            resourceId: submission.submitterId,
            previousValues: { role: "stall_operator", active: previousRole?.revokedAt === null },
            newValues: { role: "stall_operator", active: true, sourceSubmissionId: submission.id },
          },
        });
        await transaction.adminAuditLog.create({
          data: {
            actorId: user.id,
            action: "food_stall_operator_assignment.assign",
            resourceType: "food_stall_operator_assignment",
            resourceId: assignment.id,
            previousValues: Prisma.DbNull,
            newValues: { active: true, stallId: stall.id, userId: submission.submitterId },
          },
        });
      }

      const updated = await transaction.stallSubmission.updateMany({
        where: { id: submission.id, status: "pending_review" },
        data: {
          status: parsed.data.decision,
          reviewNote: parsed.data.note || null,
          reviewedBy: user.id,
          reviewedAt: new Date(),
          createdStallId,
        },
      });
      if (updated.count !== 1) throw new AdminActionFailure("stall-review-not-pending");
      await transaction.adminAuditLog.create({
        data: {
          actorId: user.id,
          action: `stall_submission.${parsed.data.decision}`,
          resourceType: "stall_submission",
          resourceId: submission.id,
          previousValues: { status: "pending_review" },
          newValues: { status: parsed.data.decision, createdStallId, reviewNoteAdded: Boolean(parsed.data.note) },
        },
      });
    }, { isolationLevel: "Serializable" });
  } catch (error) {
    if (error instanceof AdminActionFailure) errorCode = error.code;
    else {
      console.error(JSON.stringify({ level: "error", message: "Admin stall request review failed", errorName: error instanceof Error ? error.name : "UnknownError" }));
      errorCode = "stall-review-failed";
    }
  }
  if (errorCode) redirectAdminMessage(returnTo, "error", errorCode);
  revalidatePath(returnTo);
  revalidatePath("/admin/");
  revalidatePath("/stall-panel/");
  redirectAdminMessage(returnTo, "notice", parsed.data.decision === "approved" ? "stall-request-approved" : "stall-request-rejected");
}

export async function changeAccountRole(formData: FormData) {
  const returnTo = getAdminReturnPath(formData);
  const parsed = adminRoleChangeSchema.safeParse({
    userId: formData.get("userId"),
    role: formData.get("role"),
    operation: formData.get("operation"),
  });
  if (!parsed.success) redirectAdminMessage(returnTo, "error", "invalid-role");

  const { user } = await requireAdminAction();
  if (parsed.data.userId === user.id && parsed.data.role === "admin" && parsed.data.operation === "revoke") {
    redirectAdminMessage(returnTo, "error", "self-admin-revoke");
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
        if (parsed.data.role === "stall_operator") {
          const activeStallAssignments = await transaction.foodStallOperatorAssignment.findMany({
            where: { userId: parsed.data.userId, revokedAt: null },
            select: { id: true, stallId: true },
          });
          await transaction.foodStallOperatorAssignment.updateMany({
            where: { userId: parsed.data.userId, revokedAt: null },
            data: { revokedAt: new Date() },
          });
          if (activeStallAssignments.length > 0) {
            await transaction.adminAuditLog.createMany({
              data: activeStallAssignments.map((assignment) => ({
                actorId: user.id,
                action: "food_stall_operator_assignment.revoke",
                resourceType: "food_stall_operator_assignment",
                resourceId: assignment.id,
                previousValues: { active: true },
                newValues: { active: false, stallId: assignment.stallId, reason: "stall_operator_role_revoked" },
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

  if (errorCode) redirectAdminMessage(returnTo, "error", errorCode);
  revalidatePath("/admin/");
  revalidatePath("/admin/staff/");
  revalidatePath("/admin/stalls/");
  redirectAdminMessage(returnTo, "notice", "role-updated");
}

export async function changeStaffEventAssignment(formData: FormData) {
  const returnTo = getAdminReturnPath(formData) === "/admin/staff/" ? "/admin/staff/" : "/admin/";
  const parsed = adminStaffEventAssignmentSchema.safeParse({
    userId: formData.get("userId"),
    eventSlug: formData.get("eventSlug"),
    operation: formData.get("operation"),
  });
  if (!parsed.success || !events.some((event) => event.slug === parsed.data.eventSlug)) {
    redirectAdminMessage(returnTo, "error", "invalid-staff-assignment");
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

  if (errorCode) redirectAdminMessage(returnTo, "error", errorCode);
  revalidatePath("/admin/");
  revalidatePath("/admin/staff/");
  redirectAdminMessage(returnTo, "notice", "staff-assignment-updated");
}

function normalizedEventSlug(value: string) {
  return value || null;
}

function validateEventSlug(value: string) {
  return !value || events.some((event) => event.slug === value);
}

function slugifyStallName(name: string) {
  const base = name.normalize("NFKD").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 100) || "stall";
  return `${base}-${randomUUID().slice(0, 8)}`;
}

export async function createFoodStall(formData: FormData) {
  const returnTo = "/admin/stalls/";
  const parsed = adminFoodStallCreateSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") ?? "",
    category: formData.get("category"),
    eventSlug: formData.get("eventSlug") ?? "",
    location: formData.get("location") ?? "",
    status: formData.get("status"),
  });
  if (!parsed.success) redirectAdminMessage(returnTo, "error", "invalid-stall");
  if (!validateEventSlug(parsed.data.eventSlug)) redirectAdminMessage(returnTo, "error", "invalid-stall");

  const { user } = await requireAdminAction();
  let created = false;
  try {
    await getPrisma().$transaction(async (transaction) => {
      const stall = await transaction.foodStall.create({
        data: {
          ...parsed.data,
          eventSlug: normalizedEventSlug(parsed.data.eventSlug),
          slug: slugifyStallName(parsed.data.name),
          status: parsed.data.status,
        },
        select: { id: true, name: true, category: true, eventSlug: true, status: true },
      });
      await transaction.adminAuditLog.create({
        data: {
          actorId: user.id,
          action: "food_stall.create",
          resourceType: "food_stall",
          resourceId: stall.id,
          previousValues: Prisma.DbNull,
          newValues: { name: stall.name, category: stall.category, eventSlug: stall.eventSlug, status: stall.status },
        },
      });
      created = true;
    });
  } catch (error) {
    console.error(JSON.stringify({ level: "error", message: "Admin food stall creation failed", errorName: error instanceof Error ? error.name : "UnknownError" }));
  }
  if (!created) redirectAdminMessage(returnTo, "error", "stall-create-failed");
  revalidatePath(returnTo);
  redirectAdminMessage(returnTo, "notice", "stall-created");
}

export async function updateFoodStall(formData: FormData) {
  const returnTo = "/admin/stalls/";
  const parsed = adminFoodStallUpdateSchema.safeParse({
    stallId: formData.get("stallId"),
    name: formData.get("name"),
    description: formData.get("description") ?? "",
    category: formData.get("category"),
    eventSlug: formData.get("eventSlug") ?? "",
    location: formData.get("location") ?? "",
    status: formData.get("status"),
  });
  if (!parsed.success) redirectAdminMessage(returnTo, "error", "invalid-stall");
  if (!validateEventSlug(parsed.data.eventSlug)) redirectAdminMessage(returnTo, "error", "invalid-stall");

  const { user } = await requireAdminAction();
  let saveFailed = false;
  try {
    await getPrisma().$transaction(async (transaction) => {
      const previous = await transaction.foodStall.findUnique({ where: { id: parsed.data.stallId } });
      if (!previous) throw new AdminActionFailure("stall-not-found");
      const updated = await transaction.foodStall.update({
        where: { id: previous.id },
        data: {
          name: parsed.data.name,
          description: parsed.data.description || null,
          category: parsed.data.category,
          eventSlug: normalizedEventSlug(parsed.data.eventSlug),
          location: parsed.data.location || null,
          status: parsed.data.status,
        },
        select: { id: true, name: true, category: true, eventSlug: true, status: true },
      });
      await transaction.adminAuditLog.create({
        data: {
          actorId: user.id,
          action: "food_stall.update",
          resourceType: "food_stall",
          resourceId: updated.id,
          previousValues: { name: previous.name, category: previous.category, eventSlug: previous.eventSlug, status: previous.status },
          newValues: { name: updated.name, category: updated.category, eventSlug: updated.eventSlug, status: updated.status },
        },
      });
    });
  } catch (error) {
    if (error instanceof AdminActionFailure) redirectAdminMessage(returnTo, "error", error.code);
    console.error(JSON.stringify({ level: "error", message: "Admin food stall update failed", errorName: error instanceof Error ? error.name : "UnknownError" }));
    saveFailed = true;
  }
  if (saveFailed) redirectAdminMessage(returnTo, "error", "stall-update-failed");
  revalidatePath(returnTo);
  redirectAdminMessage(returnTo, "notice", "stall-updated");
}

export async function createFoodMenuItem(formData: FormData) {
  const returnTo = "/admin/stalls/";
  const parsed = adminFoodMenuItemCreateSchema.safeParse({
    stallId: formData.get("stallId"),
    name: formData.get("name"),
    description: formData.get("description") ?? "",
    priceRupees: formData.get("priceRupees"),
  });
  if (!parsed.success) redirectAdminMessage(returnTo, "error", "invalid-menu-item");

  const { user } = await requireAdminAction();
  let created = false;
  try {
    await getPrisma().$transaction(async (transaction) => {
      const item = await transaction.foodMenuItem.create({
        data: {
          stallId: parsed.data.stallId,
          name: parsed.data.name,
          description: parsed.data.description || null,
          pricePaise: parsed.data.priceRupees,
        },
        select: { id: true, stallId: true, name: true, pricePaise: true },
      });
      await transaction.adminAuditLog.create({
        data: {
          actorId: user.id,
          action: "food_menu_item.create",
          resourceType: "food_menu_item",
          resourceId: item.id,
          previousValues: Prisma.DbNull,
          newValues: { stallId: item.stallId, name: item.name, pricePaise: item.pricePaise },
        },
      });
      created = true;
    });
  } catch (error) {
    console.error(JSON.stringify({ level: "error", message: "Admin food menu item creation failed", errorName: error instanceof Error ? error.name : "UnknownError" }));
  }
  if (!created) redirectAdminMessage(returnTo, "error", "menu-item-create-failed");
  revalidatePath(returnTo);
  redirectAdminMessage(returnTo, "notice", "menu-item-created");
}

export async function changeFoodMenuItemAvailability(formData: FormData) {
  const returnTo = "/admin/stalls/";
  const parsed = adminFoodMenuItemAvailabilitySchema.safeParse({
    menuItemId: formData.get("menuItemId"),
    operation: formData.get("operation"),
  });
  if (!parsed.success) redirectAdminMessage(returnTo, "error", "invalid-menu-item");

  const { user } = await requireAdminAction();
  let saveFailed = false;
  try {
    await getPrisma().$transaction(async (transaction) => {
      const item = await transaction.foodMenuItem.findUnique({ where: { id: parsed.data.menuItemId } });
      if (!item) throw new AdminActionFailure("menu-item-not-found");
      const isAvailable = parsed.data.operation === "enable";
      await transaction.foodMenuItem.update({ where: { id: item.id }, data: { isAvailable } });
      await transaction.adminAuditLog.create({
        data: {
          actorId: user.id,
          action: `food_menu_item.${parsed.data.operation}`,
          resourceType: "food_menu_item",
          resourceId: item.id,
          previousValues: { isAvailable: item.isAvailable },
          newValues: { isAvailable },
        },
      });
    });
  } catch (error) {
    if (error instanceof AdminActionFailure) redirectAdminMessage(returnTo, "error", error.code);
    console.error(JSON.stringify({ level: "error", message: "Admin food menu item availability update failed", errorName: error instanceof Error ? error.name : "UnknownError" }));
    saveFailed = true;
  }
  if (saveFailed) redirectAdminMessage(returnTo, "error", "menu-item-update-failed");
  revalidatePath(returnTo);
  redirectAdminMessage(returnTo, "notice", "menu-item-updated");
}

export async function changeFoodStallOperatorAssignment(formData: FormData) {
  const returnTo = "/admin/stalls/";
  const parsed = adminFoodStallOperatorAssignmentSchema.safeParse({
    stallId: formData.get("stallId"),
    userId: formData.get("userId"),
    operation: formData.get("operation"),
  });
  if (!parsed.success) redirectAdminMessage(returnTo, "error", "invalid-stall-operator");

  const { user } = await requireAdminAction();
  let errorCode = "";
  try {
    await getPrisma().$transaction(async (transaction) => {
      const stall = await transaction.foodStall.findUnique({ where: { id: parsed.data.stallId }, select: { id: true } });
      if (!stall) throw new AdminActionFailure("stall-not-found");
      const role = await transaction.userRoleAssignment.findUnique({
        where: { userId_role: { userId: parsed.data.userId, role: "stall_operator" } },
        select: { revokedAt: true },
      });
      if (parsed.data.operation === "assign" && role?.revokedAt !== null) {
        throw new AdminActionFailure("stall-operator-role-required");
      }
      const current = await transaction.foodStallOperatorAssignment.findUnique({
        where: { stallId_userId: { stallId: stall.id, userId: parsed.data.userId } },
        select: { id: true, revokedAt: true },
      });
      const active = current?.revokedAt === null;
      if (parsed.data.operation === "revoke" && !active) throw new AdminActionFailure("stall-assignment-not-active");
      let assignmentId: string;
      if (parsed.data.operation === "assign") {
        const assignment = await transaction.foodStallOperatorAssignment.upsert({
          where: { stallId_userId: { stallId: stall.id, userId: parsed.data.userId } },
          create: { stallId: stall.id, userId: parsed.data.userId, assignedBy: user.id },
          update: { assignedBy: user.id, revokedAt: null },
          select: { id: true },
        });
        assignmentId = assignment.id;
      } else {
        await transaction.foodStallOperatorAssignment.update({
          where: { stallId_userId: { stallId: stall.id, userId: parsed.data.userId } },
          data: { revokedAt: new Date() },
        });
        assignmentId = current!.id;
      }
      await transaction.adminAuditLog.create({
        data: {
          actorId: user.id,
          action: `food_stall_operator_assignment.${parsed.data.operation}`,
          resourceType: "food_stall_operator_assignment",
          resourceId: assignmentId,
          previousValues: { active },
          newValues: { active: parsed.data.operation === "assign", stallId: stall.id, userId: parsed.data.userId },
        },
      });
    }, { isolationLevel: "Serializable" });
  } catch (error) {
    if (error instanceof AdminActionFailure) errorCode = error.code;
    else {
      console.error(JSON.stringify({ level: "error", message: "Admin food stall operator assignment failed", errorName: error instanceof Error ? error.name : "UnknownError" }));
      errorCode = "stall-assignment-failed";
    }
  }
  if (errorCode) redirectAdminMessage(returnTo, "error", errorCode);
  revalidatePath(returnTo);
  redirectAdminMessage(returnTo, "notice", "stall-assignment-updated");
}
