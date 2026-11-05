import "server-only";
import { ApiError } from "@/lib/backend/errors";

export function requireSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  let matches = false;
  try {
    matches = Boolean(origin) && new URL(origin as string).origin === new URL(request.url).origin;
  } catch {
    matches = false;
  }
  if (!matches) {
    throw new ApiError(403, "INVALID_ORIGIN", "This request could not be verified.");
  }
}
