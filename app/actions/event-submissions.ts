"use server";

import { getAuthenticatedUser } from "@/lib/auth";
import { ApiError } from "@/lib/backend/errors";
import { createEventSubmission } from "@/lib/backend/event-submissions";
import { eventSubmissionSchema } from "@/lib/backend/schemas";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function submitEventForReview(input: unknown) {
  try {
    const user = await getAuthenticatedUser();
    const submission = eventSubmissionSchema.parse(input);
    const result = await createEventSubmission(submission, user.id);
    return { success: true as const, data: { id: result.id, status: result.status } };
  } catch (error) {
    const parsed = eventSubmissionSchema.safeParse(input);
    const posterPath = parsed.success ? parsed.data.event.posterPath : null;
    if (posterPath?.startsWith("event-posters/")) {
      try {
        const supabase = await createSupabaseServerClient();
        await supabase.storage.from("event-posters").remove([posterPath.slice("event-posters/".length)]);
      } catch {
        console.error(JSON.stringify({ level: "error", message: "Could not clean up an orphaned event poster" }));
      }
    }
    if (error instanceof ApiError) return { success: false as const, error: error.message, code: error.code };
    if (error instanceof Error && error.name === "ZodError") return { success: false as const, error: "Check the submitted fields.", code: "VALIDATION_ERROR" };
    console.error(JSON.stringify({ level: "error", message: "Event submission failed", errorName: error instanceof Error ? error.name : "UnknownError" }));
    return { success: false as const, error: "We couldn’t save this event. Please try again later.", code: "INTERNAL_ERROR" };
  }
}
