/**
 * Create / update the production site owner account after DB restore.
 */
const fs = require("node:fs");
const path = require("node:path");
const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq);
    if (process.env[key]) continue;
    let value = trimmed.slice(eq + 1);
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

loadEnvFile(path.join(__dirname, "..", ".env.production.local"));
require("./ensure-db-env.js");

const SITE_OWNER_EMAIL = "charlesnduya84@gmail.com";
const SITE_OWNER_PASSWORD =
  process.env.SITE_OWNER_PASSWORD?.trim() || "Babyblaq555@";

async function main() {
  const prisma = new PrismaClient();
  const passwordHash = await bcrypt.hash(SITE_OWNER_PASSWORD, 10);

  const user = await prisma.user.upsert({
    where: { email: SITE_OWNER_EMAIL },
    create: {
      email: SITE_OWNER_EMAIL,
      name: "Charles Nduya",
      passwordHash,
      role: "ADMIN",
      isActive: true,
      emailVerified: new Date(),
      verificationStatus: "VERIFIED",
    },
    update: {
      passwordHash,
      role: "ADMIN",
      isActive: true,
      emailVerified: new Date(),
      verificationStatus: "VERIFIED",
      name: "Charles Nduya",
    },
  });

  console.log("Site owner ready:", user.email, user.id);
  await prisma.$disconnect();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
