-- Escrow deposits held by the platform; frozen on agent wallet after buyer approval

CREATE TYPE "EscrowDepositStatus" AS ENUM (
  'AWAITING_PAYMENT',
  'HELD',
  'FROZEN',
  'RELEASED',
  'REFUNDED',
  'CANCELLED'
);

ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "depositAmount" DOUBLE PRECISION;

CREATE TABLE "EscrowDeposit" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "offerId" TEXT,
    "buyerId" TEXT NOT NULL,
    "agentUserId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'KES',
    "status" "EscrowDepositStatus" NOT NULL DEFAULT 'AWAITING_PAYMENT',
    "paymentId" TEXT,
    "intasendRef" TEXT,
    "paidAt" TIMESTAMP(3),
    "frozenAt" TIMESTAMP(3),
    "releasedAt" TIMESTAMP(3),
    "buyerNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EscrowDeposit_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "EscrowDeposit_propertyId_idx" ON "EscrowDeposit"("propertyId");
CREATE INDEX "EscrowDeposit_buyerId_idx" ON "EscrowDeposit"("buyerId");
CREATE INDEX "EscrowDeposit_agentUserId_status_idx" ON "EscrowDeposit"("agentUserId", "status");
CREATE INDEX "EscrowDeposit_offerId_idx" ON "EscrowDeposit"("offerId");
CREATE INDEX "EscrowDeposit_status_idx" ON "EscrowDeposit"("status");

ALTER TABLE "EscrowDeposit" ADD CONSTRAINT "EscrowDeposit_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EscrowDeposit" ADD CONSTRAINT "EscrowDeposit_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "PropertyOffer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "EscrowDeposit" ADD CONSTRAINT "EscrowDeposit_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EscrowDeposit" ADD CONSTRAINT "EscrowDeposit_agentUserId_fkey" FOREIGN KEY ("agentUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
