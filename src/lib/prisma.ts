import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

// Fail fast on connect, but give real queries (admin exports, analytics scans)
// enough time to finish. Options already present in DATABASE_URL win.
function buildDatabaseUrl(): string | undefined {
  const raw = process.env.DATABASE_URL;
  if (!raw) return undefined;
  const defaults: Record<string, string> = {
    connectTimeoutMS: "10000",
    socketTimeoutMS: "30000",
    serverSelectionTimeoutMS: "10000",
  };
  const extra = Object.entries(defaults)
    .filter(([key]) => !new RegExp(`[?&]${key}=`, "i").test(raw))
    .map(([key, value]) => `${key}=${value}`)
    .join("&");
  if (!extra) return raw;
  return `${raw}${raw.includes("?") ? "&" : "?"}${extra}`;
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development"
      ? ["error", "warn"]
      : ["error"],
    datasources: { db: { url: buildDatabaseUrl() } },
  });

// Cache Prisma client in both dev and production for serverless environments
globalForPrisma.prisma = prisma;

// P2010 on MongoDB wraps driver errors (timeouts, DNS, dropped sockets); only used for reads here.
const TRANSIENT_CODES = new Set(["P1001", "P1002", "P1008", "P1017", "P2010", "P2024", "P2034"]);

export function isTransientDbError(error: unknown): boolean {
  const e = error as { code?: string; message?: string } | null;
  if (e?.code && TRANSIENT_CODES.has(e.code)) return true;
  return /server selection|timed out|ECONNRESET|connection (closed|reset|refused)|topology/i.test(
    e?.message || "",
  );
}

/** Runs `fn`, retrying up to `retries` extra times on transient connection errors. */
export async function prismaWithRetry<T>(
  fn: () => Promise<T>,
  retries = 1,
  delay = 300
): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      if (attempt >= retries || !isTransientDbError(error)) throw error;
      console.warn(`Prisma retry ${attempt + 1}/${retries}:`, error?.message);
      await new Promise((r) => setTimeout(r, delay * (attempt + 1)));
    }
  }
}

export default prisma;
