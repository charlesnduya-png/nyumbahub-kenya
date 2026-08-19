-- AlterTable
ALTER TABLE "AccountTeamMember" ADD COLUMN "roles" "TeamRole"[];

UPDATE "AccountTeamMember" SET "roles" = ARRAY["role"]::"TeamRole"[] WHERE "roles" IS NULL;

ALTER TABLE "AccountTeamMember" ALTER COLUMN "roles" SET NOT NULL;

ALTER TABLE "AccountTeamMember" DROP COLUMN "role";

-- CreateTable
CREATE TABLE "AccountTeamInvite" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "roles" "TeamRole"[] NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AccountTeamInvite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AccountTeamInvite_tokenHash_key" ON "AccountTeamInvite"("tokenHash");

-- CreateIndex
CREATE INDEX "AccountTeamInvite_teamId_idx" ON "AccountTeamInvite"("teamId");

-- CreateIndex
CREATE INDEX "AccountTeamInvite_email_idx" ON "AccountTeamInvite"("email");

-- AddForeignKey
ALTER TABLE "AccountTeamInvite" ADD CONSTRAINT "AccountTeamInvite_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "AccountTeam"("id") ON DELETE CASCADE ON UPDATE CASCADE;
