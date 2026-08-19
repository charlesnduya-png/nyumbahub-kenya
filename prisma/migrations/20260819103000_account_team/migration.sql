-- CreateEnum
CREATE TYPE "TeamRole" AS ENUM ('FULL', 'LISTINGS', 'INQUIRIES', 'VIEWINGS', 'OFFERS', 'BOOKINGS', 'MESSAGES', 'READ');

-- CreateTable
CREATE TABLE "AccountTeam" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccountTeam_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AccountTeam_ownerId_key" ON "AccountTeam"("ownerId");

-- AddForeignKey
ALTER TABLE "AccountTeam" ADD CONSTRAINT "AccountTeam_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "AccountTeamMember" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "TeamRole" NOT NULL DEFAULT 'INQUIRIES',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccountTeamMember_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AccountTeamMember_userId_key" ON "AccountTeamMember"("userId");

-- CreateIndex
CREATE INDEX "AccountTeamMember_teamId_idx" ON "AccountTeamMember"("teamId");

-- AddForeignKey
ALTER TABLE "AccountTeamMember" ADD CONSTRAINT "AccountTeamMember_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "AccountTeam"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccountTeamMember" ADD CONSTRAINT "AccountTeamMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

