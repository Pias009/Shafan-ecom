import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" 
      ? ["error", "warn"] 
      : ["error"],
    datasources: {
      db: {
        url: process.env.DATABASE_URL + "?connectTimeoutMS=30000&socketTimeoutMS=45000",
      },
    },
  });

// Cache Prisma client in both dev and production for serverless environments
globalForPrisma.prisma = prisma;

export async function prismaWithRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
  delay = 1000
): Promise<T> {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      if (i === retries - 1) throw error;
      console.warn(`Prisma retry ${i + 1}/${retries}:`, error.message);
      await new Promise((r) => setTimeout(r, delay * (i + 1)));
    }
  }
  throw new Error("Prisma retry failed");
}

export default prisma;
