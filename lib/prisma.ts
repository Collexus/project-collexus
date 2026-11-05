import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/lib/generated/prisma/client";
import { getServerEnv } from "@/lib/env";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export function getPrisma() {
  if (globalForPrisma.prisma) return globalForPrisma.prisma;
  const connectionString = getServerEnv().DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL must be configured on the server.");

  const adapter = new PrismaPg({ connectionString, max: 5, idleTimeoutMillis: 10_000, connectionTimeoutMillis: 5_000 });
  const prisma = new PrismaClient({ adapter, log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"] });
  if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
  return prisma;
}
