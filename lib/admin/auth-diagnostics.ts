type ErrorLike = {
  code?: unknown;
  message?: unknown;
  cause?: unknown;
};

function asErrorLike(value: unknown): ErrorLike {
  return typeof value === "object" && value !== null ? value as ErrorLike : {};
}

export function getAdminMfaFailureMessage(error: unknown) {
  const topLevel = asErrorLike(error);
  const cause = asErrorLike(topLevel.cause);
  const code = typeof topLevel.code === "string"
    ? topLevel.code
    : typeof cause.code === "string" ? cause.code : "";
  const message = typeof topLevel.message === "string" ? topLevel.message : "";

  if (message === "DATABASE_URL must be configured on the server.") {
    return "Admin sign-in is connected, but the server database URL is not configured. Add DATABASE_URL to the Vercel Production environment and redeploy.";
  }

  if (["P2021", "P2022", "42P01", "42703"].includes(code)) {
    return "The admin database schema is not ready. Apply the Prisma migrations to the production database, then try again.";
  }

  if (["P1000", "P1001", "P1002", "P1011", "ECONNREFUSED", "ETIMEDOUT", "ENOTFOUND"].includes(code)) {
    return "The admin database is unreachable. Check the production DATABASE_URL and database network settings, then retry.";
  }

  if (code === "MFA_STATUS_UNAVAILABLE") {
    return "Supabase Auth could not read this account’s authenticator status. Confirm TOTP enrollment and verification are enabled in Supabase, then retry.";
  }

  return "We could not confirm your administrator account. Check the server authentication and database configuration, then try again.";
}
