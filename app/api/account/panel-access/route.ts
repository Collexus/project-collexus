import { randomUUID } from "node:crypto";
import { getAuthenticatedUser } from "@/lib/auth";
import { ApiError } from "@/lib/backend/errors";
import { errorResponse, successResponse } from "@/lib/backend/responses";
import { getPrisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const requestId = randomUUID();
  try {
    const user = await getAuthenticatedUser();
    if (!process.env.DATABASE_URL) throw new ApiError(503, "DATABASE_UNAVAILABLE", "Panel access is temporarily unavailable.");
    const prisma = getPrisma();
    const [eventRole, stallRole, stallAssignment, staffRole, staffEventAssignment] = await Promise.all([
      prisma.userRoleAssignment.findFirst({
        where: { userId: user.id, role: "event_organizer", revokedAt: null },
        select: { id: true },
      }),
      prisma.userRoleAssignment.findFirst({
        where: { userId: user.id, role: "stall_operator", revokedAt: null },
        select: { id: true },
      }),
      prisma.foodStallOperatorAssignment.findFirst({
        where: { userId: user.id, revokedAt: null, stall: { status: { not: "archived" } } },
        select: { id: true },
      }),
      prisma.userRoleAssignment.findFirst({
        where: { userId: user.id, role: "staff", revokedAt: null },
        select: { id: true },
      }),
      prisma.staffEventAssignment.findFirst({
        where: { staffUserId: user.id, revokedAt: null },
        select: { id: true },
      }),
    ]);

    const response = successResponse({
      eventPanel: Boolean(eventRole),
      stallPanel: Boolean(stallRole && stallAssignment),
      staffPanel: Boolean(staffRole && staffEventAssignment),
    });
    response.headers.set("Cache-Control", "private, no-store, max-age=0");
    response.headers.set("Vary", "Cookie");
    return response;
  } catch (error) {
    const response = errorResponse(error, requestId);
    response.headers.set("Cache-Control", "private, no-store, max-age=0");
    response.headers.set("Vary", "Cookie");
    return response;
  }
}
