import { z } from "zod";

const emailSchema = z.string().trim().max(254).email().transform((email) => email.toLowerCase());
const passwordSchema = z.string().min(10, "Use at least 10 characters.").max(128, "Password is too long.");

export const adminEmailSchema = emailSchema;

export const adminSignInSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const adminMfaCodeSchema = z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code from your authenticator app.");
export const adminEmailOtpSchema = z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code from your email.");

export const adminSignUpSchema = adminSignInSchema.extend({
  confirmPassword: passwordSchema,
}).superRefine(({ password, confirmPassword }, context) => {
  if (password !== confirmPassword) {
    context.addIssue({ code: "custom", path: ["confirmPassword"], message: "Passwords do not match." });
  }
});

const adminOrigin = "https://collexus.invalid";

export function safeAdminDestination(candidate?: string) {
  if (
    !candidate ||
    !candidate.startsWith("/") ||
    candidate.startsWith("//") ||
    candidate.includes("\\") ||
    /[\u0000-\u001f\u007f]/.test(candidate)
  ) {
    return "/admin/";
  }

  try {
    const destination = new URL(candidate, adminOrigin);
    if (
      destination.origin !== adminOrigin ||
      !destination.pathname.startsWith("/admin/") ||
      destination.pathname.startsWith("/admin/login/")
    ) {
      return "/admin/";
    }

    return `${destination.pathname}${destination.search}${destination.hash}`;
  } catch {
    return "/admin/";
  }
}
