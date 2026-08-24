-- BnB platform commission ledger and escrow-ready booking split

CREATE TYPE "EscrowHoldStatus" AS ENUM ('NONE', 'AWAITING_PAYMENT', 'HELD', 'RELEASED', 'REFUNDED');
CREATE TYPE "PlatformCommissionStatus" AS ENUM ('ACCRUED', 'COLLECTED', 'REFUNDED', 'CANCELLED');

ALTER TABLE "Booking"
  ADD COLUMN IF NOT EXISTS "commissionAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "hostAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "escrowStatus" "EscrowHoldStatus" NOT NULL DEFAULT 'NONE';

CREATE TABLE IF NOT EXISTS "PlatformCommission" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "hostUserId" TEXT NOT NULL,
    "guestUserId" TEXT NOT NULL,
    "grossAmount" DOUBLE PRECISION NOT NULL,
    "commissionAmount" DOUBLE PRECISION NOT NULL,
    "hostAmount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'KES',
    "status" "PlatformCommissionStatus" NOT NULL DEFAULT 'ACCRUED',
    "collectedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlatformCommission_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "PlatformCommission_bookingId_key" ON "PlatformCommission"("bookingId");
CREATE INDEX IF NOT EXISTS "PlatformCommission_status_createdAt_idx" ON "PlatformCommission"("status", "createdAt");
CREATE INDEX IF NOT EXISTS "PlatformCommission_hostUserId_idx" ON "PlatformCommission"("hostUserId");

ALTER TABLE "PlatformCommission"
  DROP CONSTRAINT IF EXISTS "PlatformCommission_bookingId_fkey";
ALTER TABLE "PlatformCommission"
  ADD CONSTRAINT "PlatformCommission_bookingId_fkey"
  FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PlatformCommission"
  DROP CONSTRAINT IF EXISTS "PlatformCommission_hostUserId_fkey";
ALTER TABLE "PlatformCommission"
  ADD CONSTRAINT "PlatformCommission_hostUserId_fkey"
  FOREIGN KEY ("hostUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
