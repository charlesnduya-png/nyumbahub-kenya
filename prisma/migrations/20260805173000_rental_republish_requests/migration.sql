-- CreateEnum
CREATE TYPE "RentalRepublishStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateTable
CREATE TABLE "RentalRepublishRequest" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "rentalReservationId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "reason" TEXT,
    "status" "RentalRepublishStatus" NOT NULL DEFAULT 'PENDING',
    "adminNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RentalRepublishRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RentalRepublishRequest_propertyId_idx" ON "RentalRepublishRequest"("propertyId");
CREATE INDEX "RentalRepublishRequest_status_idx" ON "RentalRepublishRequest"("status");
CREATE INDEX "RentalRepublishRequest_agentId_idx" ON "RentalRepublishRequest"("agentId");

-- AddForeignKey
ALTER TABLE "RentalRepublishRequest" ADD CONSTRAINT "RentalRepublishRequest_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RentalRepublishRequest" ADD CONSTRAINT "RentalRepublishRequest_rentalReservationId_fkey" FOREIGN KEY ("rentalReservationId") REFERENCES "RentalReservation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RentalRepublishRequest" ADD CONSTRAINT "RentalRepublishRequest_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;