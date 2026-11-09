import "server-only";

import { Prisma } from "@/lib/generated/prisma/client";
import { stallRegistrationSubmissionSchema, type StallRegistrationSubmissionInput } from "@/lib/backend/schemas";
import { enforceUserRateLimit } from "@/lib/backend/rate-limit";
import { getPrisma } from "@/lib/prisma";

export async function createStallSubmission(input: unknown, submitterId: string) {
  const request: StallRegistrationSubmissionInput = stallRegistrationSubmissionSchema.parse(input);
  await enforceUserRateLimit(submitterId, "stall-submission");
  return getPrisma().stallSubmission.create({
    data: {
      submitterId,
      requestData: request as unknown as Prisma.InputJsonValue,
    },
    select: { id: true, status: true, createdAt: true },
  });
}
