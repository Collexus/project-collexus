import { NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { ApiError } from "@/lib/backend/errors";
import { errorResponse, successResponse } from "@/lib/backend/responses";
import { eventPosterSchema } from "@/lib/backend/schemas";
import { enforceUserRateLimit } from "@/lib/backend/rate-limit";
import { readRequestBytes } from "@/lib/backend/request-body";
import { requireSameOrigin } from "@/lib/backend/same-origin";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const maxBytes = 5 * 1024 * 1024;

function hasExpectedSignature(bytes: Uint8Array, mimeType: string) {
  if (mimeType === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (mimeType === "image/png") return [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((byte, index) => bytes[index] === byte);
  if (mimeType === "image/webp") return String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" && String.fromCharCode(...bytes.slice(8, 12)) === "WEBP";
  return false;
}

export async function POST(request: NextRequest) {
  const requestId = request.headers.get("x-vercel-id") ?? crypto.randomUUID();
  try {
    requireSameOrigin(request);
    if (Number(request.headers.get("content-length") ?? 0) > maxBytes) {
      throw new ApiError(413, "PAYLOAD_TOO_LARGE", "Choose an image smaller than 5 MB.");
    }
    const user = await getAuthenticatedUser();
    await enforceUserRateLimit(user.id, "event-poster-upload");
    const mimeType = request.headers.get("content-type")?.split(";", 1)[0]?.trim().toLowerCase() ?? "";
    const bytes = await readRequestBytes(request, maxBytes, "Choose a JPG, PNG, or WebP image.");
    eventPosterSchema.parse({ mimeType, size: bytes.byteLength });
    if (!hasExpectedSignature(bytes, mimeType)) throw new ApiError(400, "INVALID_FILE", "The image content does not match its file type.");

    const extension = mimeType === "image/jpeg" ? "jpg" : mimeType === "image/png" ? "png" : "webp";
    const storagePath = `${user.id}/${crypto.randomUUID()}.${extension}`;
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.storage.from("event-posters").upload(storagePath, bytes, {
      contentType: mimeType,
      upsert: false,
      cacheControl: "3600",
    });
    if (error) throw new ApiError(503, "STORAGE_UNAVAILABLE", "We couldn’t upload the poster. Please try again.");
    return successResponse({ path: `event-posters/${storagePath}` }, { status: 201 });
  } catch (error) {
    return errorResponse(error, requestId);
  }
}
