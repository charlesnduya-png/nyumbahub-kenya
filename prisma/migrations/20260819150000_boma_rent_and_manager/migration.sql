-- AlterEnum
ALTER TYPE "TeamRole" ADD VALUE IF NOT EXISTS 'RENTALS';

-- CreateEnum
CREATE TYPE "RentPaymentStatus" AS ENUM ('UNPAID', 'PAID');

-- CreateTable
CREATE TABLE "RentalRentPayment" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "tenantId" TEXT,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "amountDue" DOUBLE PRECISION NOT NULL,
    "amountPaid" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "RentPaymentStatus" NOT NULL DEFAULT 'UNPAID',
    "paidAt" TIMESTAMP(3),
    "notes" TEXT,
    "markedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RentalRentPayment_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RentalRentPayment_propertyId_year_month_key" ON "RentalRentPayment"("propertyId", "year", "month");
CREATE INDEX "RentalRentPayment_propertyId_year_month_idx" ON "RentalRentPayment"("propertyId", "year", "month");
CREATE INDEX "RentalRentPayment_status_idx" ON "RentalRentPayment"("status");

ALTER TABLE "RentalRentPayment" ADD CONSTRAINT "RentalRentPayment_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RentalRentPayment" ADD CONSTRAINT "RentalRentPayment_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "RentalRentPayment" ADD CONSTRAINT "RentalRentPayment_markedById_fkey" FOREIGN KEY ("markedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
