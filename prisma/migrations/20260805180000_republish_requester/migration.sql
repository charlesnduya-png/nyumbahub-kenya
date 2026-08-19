-- AlterTable: allow sellers (non-agents) to submit republish requests
ALTER TABLE "RentalRepublishRequest" ADD COLUMN "requesterId" TEXT;

UPDATE "RentalRepublishRequest" r
SET "requesterId" = a."userId"
FROM "Agent" a
WHERE r."agentId" = a."id" AND r."requesterId" IS NULL;

ALTER TABLE "RentalRepublishRequest" ALTER COLUMN "requesterId" SET NOT NULL;
ALTER TABLE "RentalRepublishRequest" ALTER COLUMN "agentId" DROP NOT NULL;

CREATE INDEX "RentalRepublishRequest_requesterId_idx" ON "RentalRepublishRequest"("requesterId");

ALTER TABLE "RentalRepublishRequest" ADD CONSTRAINT "RentalRepublishRequest_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
