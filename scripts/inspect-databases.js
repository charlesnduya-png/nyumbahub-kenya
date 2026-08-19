const { PrismaClient } = require("@prisma/client");

const OLD_DIRECT =
  process.env.OLD_DATABASE_URL ||
  "postgresql://neondb_owner:npg_JR2vLU4ZQPcr@ep-plain-silence-awlbjgue.c-12.us-east-1.aws.neon.tech/neondb?sslmode=require";

async function inspect(url, label) {
  const prisma = new PrismaClient({
    datasources: { db: { url } },
  });
  try {
    await prisma.$queryRaw`SELECT 1`;
    const users = await prisma.user.count();
    const properties = await prisma.property.count();
    const media = await prisma.mediaAsset.count();
    const images = await prisma.propertyImage.count();
    console.log(`${label}: OK — users=${users}, properties=${properties}, mediaAssets=${media}, images=${images}`);
    return { ok: true, users, properties, media, images };
  } catch (error) {
    console.log(`${label}: FAIL — ${error.message.split("\n")[0]}`);
    return { ok: false, error: error.message };
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  const newDirect =
    process.env.NEW_DATABASE_URL ||
    "postgresql://neondb_owner:npg_FAPnHaCzo0N6@ep-damp-band-au2kal26.c-10.us-east-1.aws.neon.tech/neondb?sslmode=require";

  await inspect(OLD_DIRECT, "OLD (yellow-fountain)");
  await inspect(newDirect, "NEW (yourhome-production)");
}

main();
