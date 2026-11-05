import { describe, expect, it } from "vitest";
import { adminRoleChangeSchema, adminStaffEventAssignmentSchema, adminSubmissionReviewSchema } from "@/lib/admin/schemas";

const userId = "2b44bb48-1a68-4c14-a63c-d16f95c9af81";

describe("admin request validation", () => {
  it("accepts a supported explicit role assignment", () => {
    expect(adminRoleChangeSchema.safeParse({ userId, role: "staff", operation: "assign" }).success).toBe(true);
  });

  it("rejects self-invented roles and invalid account identifiers", () => {
    expect(adminRoleChangeSchema.safeParse({ userId, role: "superadmin", operation: "assign" }).success).toBe(false);
    expect(adminRoleChangeSchema.safeParse({ userId: "not-a-uuid", role: "admin", operation: "assign" }).success).toBe(false);
  });

  it("accepts a review decision but limits organizer-facing notes", () => {
    expect(adminSubmissionReviewSchema.safeParse({ submissionId: userId, decision: "approved", note: "Verified with department." }).success).toBe(true);
    expect(adminSubmissionReviewSchema.safeParse({ submissionId: userId, decision: "approved", note: "x".repeat(1201) }).success).toBe(false);
  });

  it("validates explicit staff-to-event assignments", () => {
    expect(adminStaffEventAssignmentSchema.safeParse({ userId, eventSlug: "prakalp-2026", operation: "assign" }).success).toBe(true);
    expect(adminStaffEventAssignmentSchema.safeParse({ userId, eventSlug: " ", operation: "assign" }).success).toBe(false);
    expect(adminStaffEventAssignmentSchema.safeParse({ userId, eventSlug: "prakalp-2026", operation: "grant-all" }).success).toBe(false);
  });
});
