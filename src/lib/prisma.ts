import { PrismaClient } from "@prisma/client";

// Map DATABASE_URL → pooled POSTGRES_PRISMA_URL at runtime.
import "../../scripts/ensure-db-env.js";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

// Reuse one client per serverless isolate so we do not open extra Neon connections.
globalForPrisma.prisma = prisma;

export default prisma;
