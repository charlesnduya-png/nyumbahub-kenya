-- AlterTable
ALTER TABLE "User" ADD COLUMN "listingLimitOverride" INTEGER;

-- CreateEnum
CREATE TYPE "AgencyPlanTier" AS ENUM ('FREE', 'BASIC', 'PRO', 'PREMIUM', 'ENTERPRISE');

-- CreateTable
CREATE TABLE "AgencyPlanListingConfig" (
    "tier" "AgencyPlanTier" NOT NULL,
    "maxListings" INTEGER,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgencyPlanListingConfig_pkey" PRIMARY KEY ("tier")
);
