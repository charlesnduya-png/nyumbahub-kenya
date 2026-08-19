/**
 * Restore production by syncing Neon env vars to Vercel and running migrations.
 * Usage: node scripts/restore-production-db.js
 */
const { execSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const ORG_ID = "org-odd-dew-54696159";
const PROJECT_ID = process.argv[2] || "square-sunset-58374861";

function run(cmd, opts = {}) {
  return execSync(cmd, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    ...opts,
  });
}

function getConnectionStrings(projectId) {
  const direct = run(
    `npx neonctl connection-string --project-id ${projectId} --org-id ${ORG_ID}`,
  ).trim();
  const pooler = direct.replace(
    /@ep-([^.]+)\./,
    (_, id) => `@ep-${id}-pooler.`,
  );
  return { direct, pooler };
}

async function testDb(pooler, direct) {
  process.env.POSTGRES_PRISMA_URL = pooler;
  process.env.POSTGRES_URL_NON_POOLING = direct;
  process.env.DATABASE_URL = pooler;
  require("./ensure-db-env.js");
  const { PrismaClient } = require("@prisma/client");
  const prisma = new PrismaClient();
  try {
    await prisma.$queryRaw`SELECT 1`;
    const users = await prisma.user.count();
    const properties = await prisma.property.count();
    const media = await prisma.mediaAsset.count();
    return { ok: true, users, properties, media };
  } catch (error) {
    return { ok: false, error: error.message };
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  console.log(`Checking Neon project ${PROJECT_ID}…`);
  const { direct, pooler } = getConnectionStrings(PROJECT_ID);
  const status = await testDb(pooler, direct);
  console.log(JSON.stringify(status, null, 2));

  if (!status.ok) {
    process.exit(1);
  }

  console.log("Database reachable. Run migrations if schema is empty…");
  process.env.POSTGRES_PRISMA_URL = pooler;
  process.env.POSTGRES_URL_NON_POOLING = direct;
  process.env.DATABASE_URL = pooler;
  require("./ensure-db-env.js");

  if (status.properties === 0 && status.users === 0) {
    console.log("Empty database — applying migrations…");
    run("npx prisma migrate deploy", { stdio: "inherit" });
  }

  console.log("Done.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
