import "server-only";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { getServerEnv } from "@/lib/env";
import { ApiError } from "@/lib/backend/errors";

let limiter: Ratelimit | undefined;

function getLimiter() {
  if (limiter) return limiter;
  const { UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN } = getServerEnv();
  if (!UPSTASH_REDIS_REST_URL || !UPSTASH_REDIS_REST_TOKEN) return null;
  limiter = new Ratelimit({
    redis: new Redis({ url: UPSTASH_REDIS_REST_URL, token: UPSTASH_REDIS_REST_TOKEN }),
    limiter: Ratelimit.slidingWindow(5, "1 m"),
    prefix: "collexus:backend",
    analytics: false,
    timeout: 1_500,
  });
  return limiter;
}

export async function enforceUserRateLimit(userId: string, action: string) {
  const activeLimiter = getLimiter();
  if (!activeLimiter) {
    if (process.env.NODE_ENV === "production") throw new ApiError(503, "RATE_LIMIT_UNAVAILABLE", "This service is temporarily unavailable.");
    return;
  }
  try {
    const result = await activeLimiter.limit(`${action}:${userId}`);
    if (!result.success) throw new ApiError(429, "RATE_LIMITED", "Too many requests. Please wait and try again.");
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (process.env.NODE_ENV === "production") throw new ApiError(503, "RATE_LIMIT_UNAVAILABLE", "This service is temporarily unavailable.");
  }
}
