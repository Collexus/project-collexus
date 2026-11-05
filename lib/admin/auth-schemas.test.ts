import { describe, expect, it } from "vitest";
import { adminEmailOtpSchema, adminMfaCodeSchema, adminSignInSchema, adminSignUpSchema, safeAdminDestination } from "@/lib/admin/auth-schemas";

describe("admin access forms", () => {
  it("normalizes valid sign-in email addresses", () => {
    expect(adminSignInSchema.parse({ email: "  ADMIN@COLLEXUS.IN ", password: "long-password" })).toEqual({
      email: "admin@collexus.in",
      password: "long-password",
    });
  });

  it("rejects invalid emails and short passwords", () => {
    expect(adminSignInSchema.safeParse({ email: "invalid", password: "short" }).success).toBe(false);
  });

  it("requires matching signup passwords", () => {
    expect(adminSignUpSchema.safeParse({
      email: "admin@collexus.in",
      password: "long-password",
      confirmPassword: "different-password",
    }).success).toBe(false);
  });

  it("accepts only six-digit authenticator codes", () => {
    expect(adminMfaCodeSchema.parse(" 123456 ")).toBe("123456");
    expect(adminMfaCodeSchema.safeParse("12345").success).toBe(false);
    expect(adminMfaCodeSchema.safeParse("12345x").success).toBe(false);
  });

  it("accepts only six-digit email verification codes", () => {
    expect(adminEmailOtpSchema.parse(" 654321 ")).toBe("654321");
    expect(adminEmailOtpSchema.safeParse("123").success).toBe(false);
    expect(adminEmailOtpSchema.safeParse("12345x").success).toBe(false);
  });
});

describe("admin login return paths", () => {
  it("keeps admin destinations on the admin route", () => {
    expect(safeAdminDestination("/admin/?section=accounts#accounts")).toBe("/admin/?section=accounts#accounts");
  });

  it("rejects external and login-loop destinations", () => {
    expect(safeAdminDestination("https://example.com/")).toBe("/admin/");
    expect(safeAdminDestination("//example.com/" )).toBe("/admin/");
    expect(safeAdminDestination("/admin/login/?next=/admin/")).toBe("/admin/");
    expect(safeAdminDestination("/profile/")).toBe("/admin/");
  });
});
