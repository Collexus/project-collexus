import { NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { errorResponse, successResponse } from "@/lib/backend/responses";
import { createEventSubmission } from "@/lib/backend/event-submissions";
import { readJsonRequest } from "@/lib/backend/request-body";
import { requireSameOrigin } from "@/lib/backend/same-origin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const maxBodyBytes = 16_000;

export async function POST(request: NextRequest) {
  const startedAt = Date.now();
  const requestId = request.headers.get("x-vercel-id") ?? crypto.randomUUID();
  try {
    requireSameOrigin(request);
    if (!request.headers.get("content-type")?.toLowerCase().includes("application/json")) {
      return Response.json({ success: false, error: { code: "UNSUPPORTED_MEDIA_TYPE", message: "Send JSON." } }, { status: 415 });
    }
    if (Number(request.headers.get("content-length") ?? 0) > maxBodyBytes) {
      return Response.json({ success: false, error: { code: "PAYLOAD_TOO_LARGE", message: "The request is too large." } }, { status: 413 });
    }
    const body = await readJsonRequest(request, maxBodyBytes);
    const user = await getAuthenticatedUser();
    const result = await createEventSubmission(body, user.id);
    console.info(JSON.stringify({ level: "info", message: "Event submitted for review", requestId, durationMs: Date.now() - startedAt }));
    return successResponse({ id: result.id, status: result.status }, { status: 201 });
  } catch (error) {
    return errorResponse(error, requestId);
  }
}
