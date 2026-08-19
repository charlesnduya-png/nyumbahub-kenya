-- CreateEnum
CREATE TYPE "PropertyOfferStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'WITHDRAWN');

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'OFFER';

-- CreateTable
CREATE TABLE "PropertyOffer" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "buyerId" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'KES',
    "message" TEXT,
    "status" "PropertyOfferStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PropertyOffer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PropertyOffer_propertyId_idx" ON "PropertyOffer"("propertyId");

-- CreateIndex
CREATE INDEX "PropertyOffer_buyerId_idx" ON "PropertyOffer"("buyerId");

-- CreateIndex
CREATE INDEX "PropertyOffer_status_idx" ON "PropertyOffer"("status");

-- AddForeignKey
ALTER TABLE "PropertyOffer" ADD CONSTRAINT "PropertyOffer_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropertyOffer" ADD CONSTRAINT "PropertyOffer_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
