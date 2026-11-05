import { z } from "zod";

export const adminManageableRoles = ["admin", "event_organizer", "staff", "stall_operator"] as const;

export const adminRoleChangeSchema = z.object({
  userId: z.uuid(),
  role: z.enum(adminManageableRoles),
  operation: z.enum(["assign", "revoke"]),
}).strict();

export const adminSubmissionReviewSchema = z.object({
  submissionId: z.uuid(),
  decision: z.enum(["approved", "rejected"]),
  note: z.string().trim().max(1200),
}).strict();

export const adminStaffEventAssignmentSchema = z.object({
  userId: z.uuid(),
  eventSlug: z.string().trim().min(1).max(120),
  operation: z.enum(["assign", "revoke"]),
}).strict();

export type AdminManageableRole = (typeof adminManageableRoles)[number];
