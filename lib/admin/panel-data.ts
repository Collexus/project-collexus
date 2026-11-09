import "server-only";

import { eventSubmissionSchema } from "@/lib/backend/schemas";
import { stallRegistrationSubmissionSchema } from "@/lib/backend/schemas";
import { getPrisma } from "@/lib/prisma";
import { events } from "@/data/events";

const pageSize = 20;

function pagination(requestedPage: number, totalItems: number) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const page = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  return { page: Math.min(page, totalPages), totalPages, totalItems };
}

const eventCatalog = events.map(({ slug, title, dateLabel, venue, source }) => ({
  slug,
  title,
  dateLabel,
  venue,
  source,
}));

export type AdminEventSubmissionStatus = "pending_review" | "approved" | "rejected";
export type AdminStallSubmissionStatus = AdminEventSubmissionStatus;

export async function getAdminEventPanelData(requestedPage: number, status: AdminEventSubmissionStatus) {
  const prisma = getPrisma();
  const [pending, approved, rejected, totalItems] = await Promise.all([
    prisma.eventSubmission.count({ where: { status: "pending_review" } }),
    prisma.eventSubmission.count({ where: { status: "approved" } }),
    prisma.eventSubmission.count({ where: { status: "rejected" } }),
    prisma.eventSubmission.count({ where: { status } }),
  ]);
  const pages = pagination(requestedPage, totalItems);
  const rows = await prisma.eventSubmission.findMany({
    where: { status },
    orderBy: { createdAt: "desc" },
    skip: (pages.page - 1) * pageSize,
    take: pageSize,
    select: { id: true, organizerId: true, submission: true, status: true, reviewNote: true, reviewedAt: true, createdAt: true },
  });
  const organizerIds = [...new Set(rows.map(({ organizerId }) => organizerId))];
  const profiles = organizerIds.length
    ? await prisma.profile.findMany({ where: { id: { in: organizerIds } }, select: { id: true, fullName: true } })
    : [];
  const profileNames = new Map(profiles.map(({ id, fullName }) => [id, fullName?.trim() || "Unnamed account"]));

  const submissions = rows.map((row) => {
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
  });

  return {
    counts: { pending, approved, rejected },
    pagination: pages,
    submissions,
    eventCatalog,
  };
}

export async function getAdminStaffPanelData(requestedPage: number, requestedSearch: string) {
  const prisma = getPrisma();
  const search = requestedSearch.trim().slice(0, 100);
  const staffWhere = { role: "staff", revokedAt: null };
  const activeStaffCount = await prisma.userRoleAssignment.count({ where: staffWhere });
  const pages = pagination(requestedPage, activeStaffCount);
  const [activeAssignmentCount, staffRows, activeStaffIds] = await Promise.all([
    prisma.staffEventAssignment.count({ where: { revokedAt: null } }),
    prisma.userRoleAssignment.findMany({
      where: staffWhere,
      orderBy: { createdAt: "desc" },
      skip: (pages.page - 1) * pageSize,
      take: pageSize,
      select: { userId: true, createdAt: true },
    }),
    prisma.userRoleAssignment.findMany({ where: staffWhere, take: 1000, select: { userId: true } }),
  ]);

  const staffIds = staffRows.map(({ userId }) => userId);
  const staffIdSet = activeStaffIds.map(({ userId }) => userId);
  const [staffProfiles, assignments, candidateProfiles] = await Promise.all([
    staffIds.length
      ? prisma.profile.findMany({ where: { id: { in: staffIds } }, select: { id: true, fullName: true, accountType: true } })
      : Promise.resolve([]),
    staffIds.length
      ? prisma.staffEventAssignment.findMany({
          where: { staffUserId: { in: staffIds }, revokedAt: null },
          orderBy: { createdAt: "desc" },
          select: { id: true, staffUserId: true, eventSlug: true, createdAt: true },
        })
      : Promise.resolve([]),
    prisma.profile.findMany({
      where: {
        ...(staffIdSet.length ? { id: { notIn: staffIdSet } } : {}),
        ...(search ? { fullName: { contains: search, mode: "insensitive" as const } } : {}),
      },
      orderBy: { createdAt: "desc" },
      take: 30,
      select: { id: true, fullName: true, accountType: true },
    }),
  ]);
  const namesById = new Map(staffProfiles.map(({ id, fullName, accountType }) => [id, {
    name: fullName?.trim() || "Unnamed account",
    accountType: accountType ?? "Account",
  }]));
  const eventsBySlug = new Map(events.map((event) => [event.slug, event]));
  const assignmentsByStaff = new Map<string, { id: string; slug: string; title: string; dateLabel: string }[]>();
  for (const assignment of assignments) {
    const event = eventsBySlug.get(assignment.eventSlug);
    if (!event) continue;
    const list = assignmentsByStaff.get(assignment.staffUserId) ?? [];
    list.push({ id: assignment.id, slug: event.slug, title: event.title, dateLabel: event.dateLabel });
    assignmentsByStaff.set(assignment.staffUserId, list);
  }

  return {
    counts: { activeStaff: activeStaffCount, activeEventAssignments: activeAssignmentCount },
    pagination: pages,
    search,
    staff: staffRows.map(({ userId, createdAt }) => ({
      id: userId,
      name: namesById.get(userId)?.name ?? "Account profile not completed",
      accountType: namesById.get(userId)?.accountType ?? "Account",
      createdAt,
      events: assignmentsByStaff.get(userId) ?? [],
    })),
    candidateAccounts: candidateProfiles.map(({ id, fullName, accountType }) => ({
      id,
      name: fullName?.trim() || "Unnamed account",
      accountType: accountType ?? "Account",
    })),
    events: eventCatalog.map(({ slug, title, dateLabel }) => ({ slug, title, dateLabel })),
  };
}

export async function getAdminStallPanelData(requestedPage: number, requestedRequestPage: number, requestStatus: AdminStallSubmissionStatus) {
  const prisma = getPrisma();
  const [totalStalls, activeStalls, totalMenuItems, pendingRequests, approvedRequests, rejectedRequests, totalRequests] = await Promise.all([
    prisma.foodStall.count(),
    prisma.foodStall.count({ where: { status: "active" } }),
    prisma.foodMenuItem.count(),
    prisma.stallSubmission.count({ where: { status: "pending_review" } }),
    prisma.stallSubmission.count({ where: { status: "approved" } }),
    prisma.stallSubmission.count({ where: { status: "rejected" } }),
    prisma.stallSubmission.count({ where: { status: requestStatus } }),
  ]);
  const pages = pagination(requestedPage, totalStalls);
  const requestPages = pagination(requestedRequestPage, totalRequests);
  const [stalls, requestRows] = await Promise.all([
    prisma.foodStall.findMany({
      orderBy: { createdAt: "desc" },
      skip: (pages.page - 1) * pageSize,
      take: pageSize,
      include: {
        menuItems: { orderBy: { createdAt: "desc" }, take: 12 },
        operators: { where: { revokedAt: null }, orderBy: { createdAt: "desc" }, take: 20 },
      },
    }),
    prisma.stallSubmission.findMany({
      where: { status: requestStatus },
      orderBy: { createdAt: "desc" },
      skip: (requestPages.page - 1) * pageSize,
      take: pageSize,
      include: { createdStall: { select: { id: true, name: true } } },
    }),
  ]);
  const operatorIds = [...new Set(stalls.flatMap((stall) => stall.operators.map(({ userId }) => userId)))];
  const activeOperatorRoles = operatorIds.length
    ? await prisma.userRoleAssignment.findMany({
        where: { userId: { in: operatorIds }, role: "stall_operator", revokedAt: null },
        select: { userId: true },
      })
    : [];
  const activeOperatorIds = new Set(activeOperatorRoles.map(({ userId }) => userId));
  const candidateRoleRows = await prisma.userRoleAssignment.findMany({
    where: { role: "stall_operator", revokedAt: null },
    take: 200,
    select: { userId: true },
  });
  const candidateProfiles = candidateRoleRows.length
    ? await prisma.profile.findMany({
        where: { id: { in: candidateRoleRows.map(({ userId }) => userId) } },
        orderBy: { fullName: "asc" },
        select: { id: true, fullName: true },
      })
    : [];
  const operatorProfiles = operatorIds.length
    ? await prisma.profile.findMany({ where: { id: { in: operatorIds } }, select: { id: true, fullName: true } })
    : [];
  const profileNames = new Map(operatorProfiles.map(({ id, fullName }) => [id, fullName?.trim() || "Unnamed account"]));
  const candidates = candidateProfiles.map(({ id, fullName }) => ({ id, name: fullName?.trim() || "Unnamed account" }));
  const requests = requestRows.map((row) => {
    const parsed = stallRegistrationSubmissionSchema.safeParse(row.requestData);
    return {
      id: row.id,
      submitterId: row.submitterId,
      status: row.status,
      reviewNote: row.reviewNote,
      reviewedAt: row.reviewedAt,
      createdAt: row.createdAt,
      createdStall: row.createdStall,
      request: parsed.success ? parsed.data : null,
    };
  });

  return {
    counts: {
      total: totalStalls,
      active: activeStalls,
      menuItems: totalMenuItems,
      pendingRequests,
      approvedRequests,
      rejectedRequests,
    },
    pagination: pages,
    requestPagination: requestPages,
    requestStatus,
    requests,
    events: eventCatalog.map(({ slug, title, dateLabel }) => ({ slug, title, dateLabel })),
    operatorCandidates: candidates,
    stalls: stalls.map(({ operators, ...stall }) => ({
      ...stall,
      operators: operators.filter(({ userId }) => activeOperatorIds.has(userId)).map(({ id, userId, createdAt }) => ({
        id,
        userId,
        name: profileNames.get(userId) ?? "Account profile not completed",
        createdAt,
      })),
    })),
  };
}
