-- Multi-room inventory on a single RENT listing

CREATE TYPE "RentalRoomStatus" AS ENUM ('AVAILABLE', 'RENTED');

CREATE TABLE "PropertyRentalRoom" (
    "id" TEXT NOT NULL,
    "propertyId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "floor" TEXT,
    "price" DOUBLE PRECISION,
    "status" "RentalRoomStatus" NOT NULL DEFAULT 'AVAILABLE',
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PropertyRentalRoom_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "PropertyRentalRoom_propertyId_status_idx" ON "PropertyRentalRoom"("propertyId", "status");

ALTER TABLE "PropertyRentalRoom" ADD CONSTRAINT "PropertyRentalRoom_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "RentalReservation" ADD COLUMN "rentalRoomId" TEXT;

CREATE INDEX "RentalReservation_rentalRoomId_idx" ON "RentalReservation"("rentalRoomId");

ALTER TABLE "RentalReservation" ADD CONSTRAINT "RentalReservation_rentalRoomId_fkey" FOREIGN KEY ("rentalRoomId") REFERENCES "PropertyRentalRoom"("id") ON DELETE SET NULL ON UPDATE CASCADE;
