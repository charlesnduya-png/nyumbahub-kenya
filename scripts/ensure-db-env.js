/**
 * Map Neon/Vercel Postgres env vars for Prisma (local + CI).
 * Neon on Vercel exposes POSTGRES_*; local dev often only has DATABASE_URL.
 */
if (!process.env.POSTGRES_PRISMA_URL) {
  process.env.POSTGRES_PRISMA_URL =
    process.env.DATABASE_URL ?? process.env.POSTGRES_URL ?? "";
}

if (!process.env.POSTGRES_URL_NON_POOLING) {
  process.env.POSTGRES_URL_NON_POOLING =
    process.env.DATABASE_URL_UNPOOLED ??
    process.env.POSTGRES_URL_NON_POOLING ??
    process.env.POSTGRES_URL_NO_SSL ??
    process.env.DATABASE_URL ??
    process.env.POSTGRES_URL ??
    "";
}
