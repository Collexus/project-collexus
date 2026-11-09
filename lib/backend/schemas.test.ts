import { describe, expect, it } from "vitest";
import { eventPosterSchema, eventSubmissionSchema, stallRegistrationSubmissionSchema } from "@/lib/backend/schemas";

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

const validStallSubmission = {
  schemaVersion: 1,
  collexusPackage: { plan: "", addons: [], listingName: "" },
  contact: {
    name: "Ananya Rao",
    role: "Student or student team",
    organization: "RCEE Robotics Club",
    email: "ananya@example.edu",
    phone: "+91 98765 43210",
  },
  stall: {
    name: "Campus Bites",
    category: "Food & beverages",
    eventName: "Tech Fest",
    customEventName: "",
    eventDate: "2027-02-10",
    size: "Silver stall",
    locationPreference: "No preference",
    teamSize: "1–2 people",
    sellsProducts: "Yes, products or food",
    power: false,
    water: false,
    stallBox: false,
    setupNotes: "",
    foodSafety: "",
    confirmed: true,
  },
  menuItems: [{ name: "Lemonade", offerPrice: "25", eventDayPrice: "30" }],
  people: [{ name: "Ananya Rao", stallName: "Campus Bites", phone: "+91 98765 43210" }],
};

describe("stall host request validation", () => {
  it("accepts a complete stall request", () => {
    expect(stallRegistrationSubmissionSchema.parse(validStallSubmission)).toMatchObject(validStallSubmission);
  });

  it("rejects unsupported add-ons and client-only image fields", () => {
    const unsupportedAddon = { ...validStallSubmission, collexusPackage: { ...validStallSubmission.collexusPackage, addons: ["admin-access"] } };
    const imageData = { ...validStallSubmission, people: [{ ...validStallSubmission.people[0], photoDataUrl: "data:image/png;base64,abc" }] };
    expect(stallRegistrationSubmissionSchema.safeParse(unsupportedAddon).success).toBe(false);
    expect(stallRegistrationSubmissionSchema.safeParse(imageData).success).toBe(false);
  });

  it("rejects invalid phone numbers and prices", () => {
    const invalidPhone = { ...validStallSubmission, contact: { ...validStallSubmission.contact, phone: "call me" } };
    const invalidPrice = { ...validStallSubmission, menuItems: [{ ...validStallSubmission.menuItems[0], eventDayPrice: "-2" }] };
    expect(stallRegistrationSubmissionSchema.safeParse(invalidPhone).success).toBe(false);
    expect(stallRegistrationSubmissionSchema.safeParse(invalidPrice).success).toBe(false);
  });
});
