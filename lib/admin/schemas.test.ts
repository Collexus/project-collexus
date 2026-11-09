import { describe, expect, it } from "vitest";
import { adminFoodMenuItemCreateSchema, adminFoodStallCreateSchema, adminRoleChangeSchema, adminStaffEventAssignmentSchema, adminSubmissionReviewSchema } from "@/lib/admin/schemas";

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

  it("validates stall details without accepting arbitrary status values", () => {
    const stall = { name: "Campus Bites", description: "Fresh snacks", category: "Food & beverages", eventSlug: "prakalp-2026", location: "Courtyard", status: "active" };
    expect(adminFoodStallCreateSchema.safeParse(stall).success).toBe(true);
    expect(adminFoodStallCreateSchema.safeParse({ ...stall, status: "published" }).success).toBe(false);
  });

  it("converts rupee prices to integer paise and rejects more than two decimals", () => {
    const base = { stallId: userId, name: "Lemon soda", description: "Fresh lime", priceRupees: "25.50" };
    expect(adminFoodMenuItemCreateSchema.parse(base).priceRupees).toBe(2550);
    expect(adminFoodMenuItemCreateSchema.safeParse({ ...base, priceRupees: "25.555" }).success).toBe(false);
    expect(adminFoodMenuItemCreateSchema.safeParse({ ...base, priceRupees: "-1" }).success).toBe(false);
  });
});
