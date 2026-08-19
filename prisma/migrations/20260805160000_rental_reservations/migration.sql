-- CreateEnum
CREATE TYPE "RentalReservationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'RENTED');

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'RENTAL_RESERVATION';

-- CreateTable
CREATE TABLE "RentalReservation" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "moveInDate" TIMESTAMP(3),
    "message" TEXT,
    "status" "RentalReservationStatus" NOT NULL DEFAULT 'PENDING',
    "adminNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RentalReservation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RentalReservation_propertyId_idx" ON "RentalReservation"("propertyId");

-- CreateIndex
CREATE INDEX "RentalReservation_tenantId_idx" ON "RentalReservation"("tenantId");

-- CreateIndex
CREATE INDEX "RentalReservation_status_idx" ON "RentalReservation"("status");

-- AddForeignKey
ALTER TABLE "RentalReservation" ADD CONSTRAINT "RentalReservation_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RentalReservation" ADD CONSTRAINT "RentalReservation_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
