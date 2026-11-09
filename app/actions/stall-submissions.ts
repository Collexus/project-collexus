"use server";

import { getAuthenticatedUser } from "@/lib/auth";
import { ApiError } from "@/lib/backend/errors";
import { createStallSubmission } from "@/lib/backend/stall-submissions";

export async function submitStallForReview(input: unknown) {
  try {
    const user = await getAuthenticatedUser();
    const result = await createStallSubmission(input, user.id);
    return { success: true as const, data: { id: result.id, status: result.status } };
  } catch (error) {
    if (error instanceof ApiError) return { success: false as const, error: error.message, code: error.code };
    if (error instanceof Error && error.name === "ZodError") return { success: false as const, error: "Check the submitted fields.", code: "VALIDATION_ERROR" };
    console.error(JSON.stringify({ level: "error", message: "Stall submission failed", errorName: error instanceof Error ? error.name : "UnknownError" }));
    return { success: false as const, error: "We couldn’t save this stall request. Please try again later.", code: "INTERNAL_ERROR" };
  }
}
