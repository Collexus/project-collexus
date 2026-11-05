import { describe, expect, it } from "vitest";
import { eventPosterSchema, eventSubmissionSchema } from "@/lib/backend/schemas";

const validSubmission = {
  schemaVersion: 1,
  organizer: {
    name: "Ananya Rao",
    occupation: "Student",
    institution: "Ramachandra College of Engineering",
    batch: "3",
    email: "ananya@example.edu",
    phone: "+91 98765 43210",
  },
  event: {
    name: "Campus Innovation Week",
    category: "Workshop",
    template: "Workshop or seminar",
    description: "Hands-on engineering sessions for students.",
    expectedParticipants: 120,
    startDate: "2027-02-10",
    endDate: "2027-02-10",
    startTime: "09:00",
    endTime: "16:00",
    mode: "In person",
    venue: "RCEE, Eluru",
    pricing: "free",
    price: 0,
  },
};

describe("event submission validation", () => {
  it("accepts a complete free event submission", () => {
    expect(eventSubmissionSchema.parse(validSubmission)).toMatchObject(validSubmission);
  });

  it("rejects an end time before the start time", () => {
    const invalid = { ...validSubmission, event: { ...validSubmission.event, endTime: "08:00" } };
    expect(eventSubmissionSchema.safeParse(invalid).success).toBe(false);
  });

  it("rejects impossible calendar dates and times", () => {
    const invalidDate = { ...validSubmission, event: { ...validSubmission.event, startDate: "2027-02-30" } };
    const invalidTime = { ...validSubmission, event: { ...validSubmission.event, startTime: "25:90" } };
    expect(eventSubmissionSchema.safeParse(invalidDate).success).toBe(false);
    expect(eventSubmissionSchema.safeParse(invalidTime).success).toBe(false);
  });

  it("rejects paid submissions with no price", () => {
    const invalid = { ...validSubmission, event: { ...validSubmission.event, pricing: "paid", price: 0 } };
    expect(eventSubmissionSchema.safeParse(invalid).success).toBe(false);
  });

  it("rejects unsupported file formats and files above the size limit", () => {
    expect(eventPosterSchema.safeParse({ mimeType: "image/svg+xml", size: 1024 }).success).toBe(false);
    expect(eventPosterSchema.safeParse({ mimeType: "image/png", size: 5 * 1024 * 1024 + 1 }).success).toBe(false);
  });
});
