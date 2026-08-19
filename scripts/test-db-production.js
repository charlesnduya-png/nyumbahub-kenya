require("./ensure-db-env.js");

const { PrismaClient } = require("@prisma/client");

async function main() {
  const host =
    process.env.POSTGRES_HOST ||
    process.env.PGHOST ||
    (process.env.DATABASE_URL || "").split("@")[1]?.split("/")[0] ||
    "unknown";

  console.log("DB host:", host);
  console.log(
    "POSTGRES_PRISMA_URL:",
    process.env.POSTGRES_PRISMA_URL ? "set" : "missing",
  );
  console.log("DATABASE_URL:", process.env.DATABASE_URL ? "set" : "missing");

  const prisma = new PrismaClient();
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log("DB connection: OK");

    const users = await prisma.user.count();
    const properties = await prisma.property.count();
    const media = await prisma.mediaAsset.count();
    console.log("Users:", users);
    console.log("Properties:", properties);
    console.log("MediaAssets:", media);
  } catch (error) {
    console.error("DB connection: FAIL");
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();
