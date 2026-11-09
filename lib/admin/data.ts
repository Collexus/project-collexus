import "server-only";

import { eventSubmissionSchema } from "@/lib/backend/schemas";
import { getPrisma } from "@/lib/prisma";
import { events } from "@/data/events";

export const roleLabels: Record<string, string> = {
  student: "Student",
  admin: "Administrator",
  event_organizer: "Event organizer",
  staff: "Event staff",
  stall_operator: "Stall operator",
};

export function formatAdminDate(value: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(value);
}

export function formatAdminDateTime(value: Date) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Kolkata",
    timeZoneName: "short",
  }).format(value);
}

const pageSize = 20;

function clampPage(requested: number, totalItems: number) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const page = Number.isSafeInteger(requested) && requested > 0 ? requested : 1;
  return { page: Math.min(page, totalPages), totalPages, totalItems };
}

export async function getAdminDashboardData(requestedPages: { submissions: number; accounts: number; audit: number }) {
  const prisma = getPrisma();
  const [profileCount, pendingCount, approvedCount, rejectedCount, activeAdmins, auditCount] = await Promise.all([
    prisma.profile.count(),
    prisma.eventSubmission.count({ where: { status: "pending_review" } }),
    prisma.eventSubmission.count({ where: { status: "approved" } }),
    prisma.eventSubmission.count({ where: { status: "rejected" } }),
    prisma.userRoleAssignment.count({ where: { role: "admin", revokedAt: null } }),
    prisma.adminAuditLog.count(),
  ]);

  const pagination = {
    submissions: clampPage(requestedPages.submissions, pendingCount),
    accounts: clampPage(requestedPages.accounts, profileCount),
    audit: clampPage(requestedPages.audit, auditCount),
  };

  const [submissionRows, reviewedRows, accountRows, auditRows] = await Promise.all([
    prisma.eventSubmission.findMany({
      where: { status: "pending_review" },
      orderBy: { createdAt: "desc" },
      skip: (pagination.submissions.page - 1) * pageSize,
      take: pageSize,
      select: { id: true, organizerId: true, submission: true, status: true, reviewNote: true, reviewedAt: true, createdAt: true },
    }),
    prisma.eventSubmission.findMany({
      where: { status: { in: ["approved", "rejected"] } },
      orderBy: { reviewedAt: "desc" },
      take: 8,
      select: { id: true, organizerId: true, submission: true, status: true, reviewNote: true, reviewedAt: true, createdAt: true },
    }),
    prisma.profile.findMany({
      orderBy: { createdAt: "desc" },
      skip: (pagination.accounts.page - 1) * pageSize,
      take: pageSize,
      select: { id: true, fullName: true, accountType: true, createdAt: true },
    }),
    prisma.adminAuditLog.findMany({
      orderBy: { createdAt: "desc" },
      skip: (pagination.audit.page - 1) * pageSize,
      take: pageSize,
      select: { id: true, actorId: true, action: true, resourceType: true, resourceId: true, createdAt: true },
    }),
  ]);

  const profileIds = accountRows.map(({ id }) => id);
  const referencedIds = [...new Set([
    ...profileIds,
    ...submissionRows.map(({ organizerId }) => organizerId),
    ...reviewedRows.map(({ organizerId }) => organizerId),
    ...auditRows.map(({ actorId }) => actorId),
  ])];

  const [assignments, staffEventAssignments, referencedProfiles] = await Promise.all([
    profileIds.length
      ? prisma.userRoleAssignment.findMany({
          where: { userId: { in: profileIds }, revokedAt: null },
          select: { userId: true, role: true },
        })
      : Promise.resolve([]),
    profileIds.length
      ? prisma.staffEventAssignment.findMany({
          where: { staffUserId: { in: profileIds }, revokedAt: null },
          orderBy: { createdAt: "desc" },
          select: { id: true, staffUserId: true, eventSlug: true },
        })
      : Promise.resolve([]),
    referencedIds.length
      ? prisma.profile.findMany({ where: { id: { in: referencedIds } }, select: { id: true, fullName: true } })
      : Promise.resolve([]),
  ]);

  const eventsBySlug = new Map(events.map((event) => [event.slug, event]));
  const staffEventsByUser = new Map<string, { id: string; slug: string; title: string; dateLabel: string }[]>();
  for (const assignment of staffEventAssignments) {
    const event = eventsBySlug.get(assignment.eventSlug);
    if (!event) continue;
    const assignedEvents = staffEventsByUser.get(assignment.staffUserId) ?? [];
    assignedEvents.push({ id: assignment.id, slug: event.slug, title: event.title, dateLabel: event.dateLabel });
    staffEventsByUser.set(assignment.staffUserId, assignedEvents);
  }

  const profileNames = new Map(referencedProfiles.map(({ id, fullName }) => [id, fullName?.trim() || "Unnamed account"]));
  const rolesByUser = new Map<string, string[]>();
  for (const assignment of assignments) {
    const roles = rolesByUser.get(assignment.userId) ?? [];
    roles.push(assignment.role);
    rolesByUser.set(assignment.userId, roles);
  }

  const mapSubmission = (row: (typeof submissionRows)[number]) => {
    const parsed = eventSubmissionSchema.safeParse(row.submission);
    const details = parsed.success ? parsed.data : null;
    return {
      id: row.id,
      status: row.status,
      createdAt: row.createdAt,
      reviewedAt: row.reviewedAt,
      reviewNote: row.reviewNote,
      organizerName: details?.organizer.name ?? profileNames.get(row.organizerId) ?? "Organizer account",
      organizerInstitution: details?.organizer.institution ?? "",
      eventName: details?.event.name ?? "Submission needs data review",
      category: details?.event.category ?? "Unclassified",
      startDate: details?.event.startDate ?? null,
      endDate: details?.event.endDate ?? null,
      venue: details?.event.venue ?? "",
      description: details?.event.description ?? "The saved record does not match the current submission format.",
      pricing: details?.event.pricing ?? null,
      price: details?.event.price ?? null,
      organizerEmail: details?.organizer.email ?? "",
    };
  };
  const submissions = submissionRows.map(mapSubmission);
  const reviewed = reviewedRows.map(mapSubmission);

  const accounts = accountRows.map((profile) => {
    const roles = rolesByUser.get(profile.id) ?? [];
    return {
      id: profile.id,
      name: profile.fullName?.trim() || "Unnamed account",
      accountType: profile.accountType ?? "Account",
      createdAt: profile.createdAt,
      roles: roles.length ? roles : ["student"],
      staffEvents: staffEventsByUser.get(profile.id) ?? [],
    };
  });

  return {
    metrics: {
      profiles: profileCount,
      pending: pendingCount,
      approved: approvedCount,
      rejected: rejectedCount,
      activeAdmins,
    },
    pagination,
    submissions,
    reviewed,
    accounts,
    audit: auditRows.map((row) => ({
      ...row,
      actorName: profileNames.get(row.actorId) ?? "Administrator",
    })),
  };
}
