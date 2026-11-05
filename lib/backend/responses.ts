import * as Sentry from "@sentry/nextjs";
import { ZodError } from "zod";
import { ApiError } from "@/lib/backend/errors";

export function successResponse<T>(data: T, init?: ResponseInit) {
  return Response.json({ success: true, data }, init);
}

export function errorResponse(error: unknown, requestId: string) {
  if (error instanceof ZodError) {
    return Response.json(
      {
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Check the submitted fields.",
          details: error.issues.map(({ path, message }) => ({ path, message })),
        },
      },
      { status: 400 },
    );
  }
  if (error instanceof ApiError) {
    return Response.json({ success: false, error: { code: error.code, message: error.message } }, { status: error.status });
  }

  console.error(JSON.stringify({ level: "error", message: "Unhandled backend request error", requestId, errorName: error instanceof Error ? error.name : "UnknownError" }));
  Sentry.captureException(error, { tags: { requestId } });
  return Response.json({ success: false, error: { code: "INTERNAL_ERROR", message: "Something went wrong. Please try again." } }, { status: 500 });
}
