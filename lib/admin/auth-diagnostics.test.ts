import { describe, expect, it } from "vitest";
import { getAdminMfaFailureMessage } from "@/lib/admin/auth-diagnostics";

describe("admin MFA setup diagnostics", () => {
  it("explains when the server database URL is missing without exposing configuration values", () => {
    const message = getAdminMfaFailureMessage(new Error("DATABASE_URL must be configured on the server."));
    expect(message).toContain("DATABASE_URL");
    expect(message).toContain("Vercel Production");
  });

  it("identifies an unapplied admin schema from a PostgreSQL relation error", () => {
    expect(getAdminMfaFailureMessage({ code: "42P01" })).toContain("Apply the Prisma migrations");
    expect(getAdminMfaFailureMessage({ code: "P2021" })).toContain("Apply the Prisma migrations");
  });

  it("points database connection failures to the production URL", () => {
    expect(getAdminMfaFailureMessage({ code: "P1001" })).toContain("production DATABASE_URL");
  });

  it("distinguishes Supabase MFA status failures from database setup failures", () => {
    expect(getAdminMfaFailureMessage({ code: "MFA_STATUS_UNAVAILABLE" })).toContain("TOTP");
  });

  it("keeps unknown failures generic", () => {
    expect(getAdminMfaFailureMessage(new Error("internal detail"))).toBe(
      "We could not confirm your administrator account. Check the server authentication and database configuration, then try again.",
    );
  });
});
