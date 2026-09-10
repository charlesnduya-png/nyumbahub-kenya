-- AlterTable
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "country" TEXT;

-- CreateIndex
CREATE INDEX IF NOT EXISTS "User_country_idx" ON "User"("country");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "User_role_createdAt_idx" ON "User"("role", "createdAt");
