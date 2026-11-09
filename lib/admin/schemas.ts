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

export const adminStallSubmissionReviewSchema = z.object({
  submissionId: z.uuid(),
  decision: z.enum(["approved", "rejected"]),
  note: z.string().trim().max(1200),
}).strict();

export const adminStaffEventAssignmentSchema = z.object({
  userId: z.uuid(),
  eventSlug: z.string().trim().min(1).max(120),
  operation: z.enum(["assign", "revoke"]),
}).strict();

export const foodStallCategories = [
  "Food & beverages",
  "Art & handmade goods",
  "Student startup",
  "Books & merchandise",
  "Club / community",
  "Games & activities",
  "Other",
] as const;

const foodStallFields = {
  name: z.string().trim().min(1).max(160),
  description: z.string().trim().max(600),
  category: z.enum(foodStallCategories),
  eventSlug: z.string().trim().max(120),
  location: z.string().trim().max(200),
};

export const adminFoodStallCreateSchema = z.object({
  ...foodStallFields,
  status: z.enum(["draft", "active"]),
}).strict();

export const adminFoodStallUpdateSchema = z.object({
  stallId: z.uuid(),
  ...foodStallFields,
  status: z.enum(["draft", "active", "paused", "archived"]),
}).strict();

const priceRupeesSchema = z.string()
  .trim()
  .regex(/^(?:0|[1-9]\d{0,5})(?:\.\d{1,2})?$/, "Enter a price with up to two decimal places.")
  .transform((price) => {
    const [rupees, paise = ""] = price.split(".");
    return Number(rupees) * 100 + Number(paise.padEnd(2, "0"));
  })
  .pipe(z.number().int().min(0).max(50_000_000));

export const adminFoodMenuItemCreateSchema = z.object({
  stallId: z.uuid(),
  name: z.string().trim().min(1).max(120),
  description: z.string().trim().max(300),
  priceRupees: priceRupeesSchema,
}).strict();

export const adminFoodMenuItemAvailabilitySchema = z.object({
  menuItemId: z.uuid(),
  operation: z.enum(["enable", "disable"]),
}).strict();

export const adminFoodStallOperatorAssignmentSchema = z.object({
  stallId: z.uuid(),
  userId: z.uuid(),
  operation: z.enum(["assign", "revoke"]),
}).strict();

export type AdminManageableRole = (typeof adminManageableRoles)[number];
