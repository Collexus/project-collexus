import "server-only";
import { Prisma } from "@/lib/generated/prisma/client";
import type { EventSubmissionInput } from "@/lib/backend/schemas";
import { eventSubmissionSchema } from "@/lib/backend/schemas";
import { enforceUserRateLimit } from "@/lib/backend/rate-limit";
import { getPrisma } from "@/lib/prisma";
import { ApiError } from "@/lib/backend/errors";

export async function createEventSubmission(input: unknown, organizerId: string) {
  const submission: EventSubmissionInput = eventSubmissionSchema.parse(input);
  if (submission.event.posterPath && !submission.event.posterPath.startsWith(`event-posters/${organizerId}/`)) {
    throw new ApiError(403, "POSTER_FORBIDDEN", "You can only attach a poster that you uploaded.");
  }
  await enforceUserRateLimit(organizerId, "event-submission");
  const created = await getPrisma().eventSubmission.create({
    data: {
      organizerId,
      submission: submission as unknown as Prisma.InputJsonValue,
    },
    select: { id: true, status: true, createdAt: true },
  });
  return created;
}
