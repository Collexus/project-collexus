import { z } from "zod";

const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const timePattern = /^\d{2}:\d{2}$/;

function isRealDate(value: string) {
  if (!datePattern.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return parsed.getUTCFullYear() === year && parsed.getUTCMonth() === month - 1 && parsed.getUTCDate() === day;
}

export const eventSubmissionSchema = z.object({
  schemaVersion: z.literal(1),
  collexusPackage: z.object({
    plan: z.enum(["normal", "pro", ""]),
    addons: z.array(z.string().max(80)).max(10),
    listingName: z.string().max(160),
  }).optional(),
  organizer: z.object({
    name: z.string().trim().min(1).max(120),
    occupation: z.enum(["Student", "Faculty", "Staff", "Alumni", "External organizer"]),
    institution: z.string().trim().min(1).max(180),
    batch: z.enum(["1", "2", "3", "4", "all", "faculty"]),
    email: z.email().max(254),
    phone: z.string().trim().min(7).max(20).regex(/^[+0-9() .-]+$/),
  }),
  event: z.object({
    name: z.string().trim().min(1).max(160),
    category: z.enum(["Hackathon", "Workshop", "Project expo", "Cultural event", "Sports & outdoors", "Career & internship", "Branch event", "Other"]),
    template: z.enum(["Workshop or seminar", "Hackathon or competition", "Festival or cultural event", "Sports meet", "Project expo", "General campus event"]),
    description: z.string().trim().min(1).max(600),
    expectedParticipants: z.number().int().min(1).max(100_000),
    startDate: z.string().refine(isRealDate, "Enter a valid calendar date."),
    endDate: z.string().refine(isRealDate, "Enter a valid calendar date."),
    startTime: z.string().regex(timePattern).refine((value) => {
      const [hours, minutes] = value.split(":").map(Number);
      return hours <= 23 && minutes <= 59;
    }, "Enter a valid time."),
    endTime: z.string().regex(timePattern).refine((value) => {
      const [hours, minutes] = value.split(":").map(Number);
      return hours <= 23 && minutes <= 59;
    }, "Enter a valid time."),
    mode: z.enum(["In person", "Online", "Hybrid"]),
    venue: z.string().trim().min(1).max(240),
    pricing: z.enum(["free", "paid"]),
    price: z.number().finite().min(0),
    posterPath: z.string().max(240).nullable().optional(),
  }).superRefine((event, context) => {
    if (`${event.endDate}T${event.endTime}` <= `${event.startDate}T${event.startTime}`) {
      context.addIssue({ code: "custom", path: ["endDate"], message: "End date and time must be after the start." });
    }
    if (event.pricing === "paid" && event.price < 1) context.addIssue({ code: "custom", path: ["price"], message: "Paid events must have a price of at least ₹1." });
    if (event.pricing === "free" && event.price !== 0) context.addIssue({ code: "custom", path: ["price"], message: "Free events must have a zero price." });
    if (event.posterPath && !event.posterPath.startsWith("event-posters/")) context.addIssue({ code: "custom", path: ["posterPath"], message: "Invalid poster path." });
  }),
}).strict();

export const eventPosterSchema = z.object({
  mimeType: z.enum(["image/jpeg", "image/png", "image/webp"]),
  size: z.number().int().positive().max(5 * 1024 * 1024),
});

export type EventSubmissionInput = z.infer<typeof eventSubmissionSchema>;
