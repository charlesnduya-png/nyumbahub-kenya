-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'JOB_PARTNER';

-- AlterEnum
ALTER TYPE "WalletTxType" ADD VALUE 'HOTEL_RECRUITMENT';

-- AlterTable
ALTER TABLE "User" ADD COLUMN "referredByJobPartnerUserId" TEXT;

-- CreateTable
CREATE TABLE "JobPartnerProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "referralCode" TEXT NOT NULL,
    "hotelsReferred" INTEGER NOT NULL DEFAULT 0,
    "bio" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "JobPartnerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "JobPartnerProfile_userId_key" ON "JobPartnerProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "JobPartnerProfile_referralCode_key" ON "JobPartnerProfile"("referralCode");

-- CreateIndex
CREATE INDEX "JobPartnerProfile_referralCode_idx" ON "JobPartnerProfile"("referralCode");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_referredByJobPartnerUserId_fkey" FOREIGN KEY ("referredByJobPartnerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobPartnerProfile" ADD CONSTRAINT "JobPartnerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
