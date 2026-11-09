import "server-only";
import { z } from "zod";

const optionalString = z.preprocess((value) => value === "" ? undefined : value, z.string().min(1).optional());
const optionalUrl = z.preprocess((value) => value === "" ? undefined : value, z.string().url().optional());
const optionalPostgresUrl = z.preprocess(
  (value) => value === "" ? undefined : value,
  z.string().url().refine((value) => value.startsWith("postgres://") || value.startsWith("postgresql://"), "Expected a PostgreSQL connection URL.").optional(),
);

const serverEnvSchema = z.object({
  DATABASE_URL: optionalPostgresUrl,
  DIRECT_URL: optionalPostgresUrl,
  NEXT_PUBLIC_SUPABASE_URL: optionalUrl,
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: optionalString,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: optionalString,
  RAZORPAY_KEY_ID: optionalString,
  RAZORPAY_KEY_SECRET: optionalString,
  RAZORPAY_WEBHOOK_SECRET: optionalString,
  UPSTASH_REDIS_REST_URL: optionalUrl,
  UPSTASH_REDIS_REST_TOKEN: optionalString,
  SENTRY_DSN: optionalUrl,
});

export function getServerEnv() {
  const parsed = serverEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error("Server environment configuration is invalid.");
  }
  const values = parsed.data;
  const razorpayCredentials = [values.RAZORPAY_KEY_ID, values.RAZORPAY_KEY_SECRET];
  if (razorpayCredentials.some(Boolean) && razorpayCredentials.some((value) => !value)) {
    throw new Error("Set both Razorpay API key environment variables, or neither.");
  }
  if (Boolean(values.UPSTASH_REDIS_REST_URL) !== Boolean(values.UPSTASH_REDIS_REST_TOKEN)) {
    throw new Error("Set both Upstash Redis REST environment variables, or neither.");
  }
  return values;
}

export function getSupabasePublicConfig() {
  const { NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, NEXT_PUBLIC_SUPABASE_ANON_KEY } = getServerEnv();
  const key = NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!NEXT_PUBLIC_SUPABASE_URL || !key) {
    throw new Error("Supabase URL and publishable key are required for server authentication.");
  }
  return { url: NEXT_PUBLIC_SUPABASE_URL, key };
}
