/**
 * One-off / ops: demote expired featured/sponsored/premium listings on Neon.
 * Usage: node scripts/expire-listing-promotions-now.js
 */
const { execSync } = require("node:child_process");
const { PrismaClient } = require("@prisma/client");

const ORG_ID = "org-odd-dew-54696159";
const PROJECT_ID = "square-sunset-58374861";

const direct = execSync(
  `npx neonctl connection-string --project-id ${PROJECT_ID} --org-id ${ORG_ID}`,
  { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
).trim();
const pooler = direct.replace(/@ep-([^.]+)\./, "@ep-$1-pooler.");
process.env.POSTGRES_PRISMA_URL = `${pooler}${pooler.includes("?") ? "&" : "?"}pgbouncer=true&connection_limit=1`;
process.env.POSTGRES_URL_NON_POOLING = direct;
process.env.DATABASE_URL = process.env.POSTGRES_PRISMA_URL;

async function main() {
  const prisma = new PrismaClient();
  const now = new Date();

  try {
    const featuredBefore = await prisma.property.findMany({
      where: {
        OR: [{ isFeatured: true }, { isSponsored: true }, { isPremium: true }],
      },
      select: {
        id: true,
        title: true,
        slug: true,
        ownerId: true,
        isFeatured: true,
        isSponsored: true,
        isPremium: true,
        expiresAt: true,
        status: true,
      },
      orderBy: { updatedAt: "desc" },
      take: 50,
    });

    console.log(
      JSON.stringify(
        {
          now: now.toISOString(),
          featuredCount: featuredBefore.length,
          featured: featuredBefore.map((p) => ({
            id: p.id,
            title: p.title,
            status: p.status,
            isFeatured: p.isFeatured,
            isSponsored: p.isSponsored,
            isPremium: p.isPremium,
            expiresAt: p.expiresAt?.toISOString() ?? null,
            expired:
              p.expiresAt != null ? p.expiresAt.getTime() <= now.getTime() : null,
          })),
        },
        null,
        2,
      ),
    );

    // Inline same rules as src/lib/listing-boost.ts expireListingPromotions
    // (script runs without Next path aliases).
    const candidates = await prisma.property.findMany({
      where: {
        OR: [{ isFeatured: true }, { isSponsored: true }, { isPremium: true }],
        AND: [{ OR: [{ expiresAt: { lte: now } }, { expiresAt: null }] }],
      },
      select: {
        id: true,
        slug: true,
        ownerId: true,
        expiresAt: true,
        isFeatured: true,
        isSponsored: true,
        isPremium: true,
      },
    });

    let demoted = 0;
    let refreshed = 0;
    const demotedIds = [];

    for (const listing of candidates) {
      if (listing.expiresAt && listing.expiresAt > now) continue;

      const subscription = await prisma.subscription.findFirst({
        where: {
          userId: listing.ownerId,
          status: "ACTIVE",
          plan: {
            in: ["BASIC", "PREMIUM", "AGENT_PRO", "AGENT_ENTERPRISE"],
          },
          OR: [{ endDate: null }, { endDate: { gt: now } }],
        },
        orderBy: { endDate: "desc" },
      });

      let keepFeatured = false;
      let keepSponsored = false;
      let keepPremium = false;
      if (subscription) {
        if (
          subscription.plan === "PREMIUM" ||
          subscription.plan === "AGENT_PRO"
        ) {
          keepFeatured = true;
        } else if (subscription.plan === "AGENT_ENTERPRISE") {
          keepFeatured = true;
          keepSponsored = true;
          keepPremium = true;
        }
      }

      if (keepFeatured || keepSponsored || keepPremium) {
        await prisma.property.update({
          where: { id: listing.id },
          data: {
            isFeatured: keepFeatured,
            isSponsored: keepSponsored,
            isPremium: keepPremium,
            expiresAt: subscription?.endDate ?? listing.expiresAt,
          },
        });
        refreshed += 1;
        continue;
      }

      await prisma.property.update({
        where: { id: listing.id },
        data: {
          isFeatured: false,
          isSponsored: false,
          isPremium: false,
        },
      });
      demoted += 1;
      demotedIds.push(listing.id);
    }

    const featuredAfter = await prisma.property.count({
      where: { isFeatured: true },
    });

    console.log(
      JSON.stringify(
        {
          checked: candidates.length,
          demoted,
          refreshed,
          demotedIds,
          featuredAfter,
        },
        null,
        2,
      ),
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
