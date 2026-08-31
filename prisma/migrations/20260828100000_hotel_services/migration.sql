-- CreateEnum
CREATE TYPE "HotelServiceCategory" AS ENUM (
  'GROUP_BOOKING',
  'EVENT_CONFERENCE',
  'EVENT_BOOKING_REQUEST',
  'SPORTS_TEAM',
  'COOPERATIVE',
  'HOTEL_OFFER'
);

-- CreateEnum
CREATE TYPE "HotelPlanTier" AS ENUM (
  'FREE',
  'STARTER',
  'PRO',
  'BUSINESS',
  'ENTERPRISE'
);

-- CreateEnum
CREATE TYPE "HotelServiceRequestStatus" AS ENUM (
  'NEW',
  'REVIEWING',
  'QUOTED',
  'CONFIRMED',
  'DECLINED',
  'CANCELLED'
);

-- CreateTable
CREATE TABLE "HotelPackage" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "propertyId" TEXT,
    "category" "HotelServiceCategory" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "minGuests" INTEGER,
    "maxGuests" INTEGER,
    "minRooms" INTEGER,
    "priceFrom" DOUBLE PRECISION,
    "priceTo" DOUBLE PRECISION,
    "currency" TEXT NOT NULL DEFAULT 'KES',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "validFrom" TIMESTAMP(3),
    "validUntil" TIMESTAMP(3),
    "terms" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HotelPackage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HotelServiceRequest" (
    "id" TEXT NOT NULL,
    "packageId" TEXT,
    "propertyId" TEXT,
    "ownerId" TEXT NOT NULL,
    "guestId" TEXT,
    "category" "HotelServiceCategory" NOT NULL,
    "contactName" TEXT NOT NULL,
    "contactEmail" TEXT,
    "contactPhone" TEXT,
    "organization" TEXT,
    "eventTitle" TEXT,
    "checkIn" TIMESTAMP(3),
    "checkOut" TIMESTAMP(3),
    "guestCount" INTEGER,
    "roomCount" INTEGER,
    "message" TEXT,
    "status" "HotelServiceRequestStatus" NOT NULL DEFAULT 'NEW',
    "ownerNote" TEXT,
    "quotedAmount" DOUBLE PRECISION,
    "currency" TEXT NOT NULL DEFAULT 'KES',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HotelServiceRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HotelAccountPlan" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tier" "HotelPlanTier" NOT NULL DEFAULT 'FREE',
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HotelAccountPlan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "HotelPackage_ownerId_category_idx" ON "HotelPackage"("ownerId", "category");

-- CreateIndex
CREATE INDEX "HotelPackage_propertyId_idx" ON "HotelPackage"("propertyId");

-- CreateIndex
CREATE INDEX "HotelPackage_isActive_idx" ON "HotelPackage"("isActive");

-- CreateIndex
CREATE INDEX "HotelServiceRequest_ownerId_category_idx" ON "HotelServiceRequest"("ownerId", "category");

-- CreateIndex
CREATE INDEX "HotelServiceRequest_propertyId_idx" ON "HotelServiceRequest"("propertyId");

-- CreateIndex
CREATE INDEX "HotelServiceRequest_status_idx" ON "HotelServiceRequest"("status");

-- CreateIndex
CREATE INDEX "HotelServiceRequest_guestId_idx" ON "HotelServiceRequest"("guestId");

-- CreateIndex
CREATE UNIQUE INDEX "HotelAccountPlan_userId_key" ON "HotelAccountPlan"("userId");

-- CreateIndex
CREATE INDEX "HotelAccountPlan_tier_idx" ON "HotelAccountPlan"("tier");

-- AddForeignKey
ALTER TABLE "HotelPackage" ADD CONSTRAINT "HotelPackage_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HotelPackage" ADD CONSTRAINT "HotelPackage_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HotelServiceRequest" ADD CONSTRAINT "HotelServiceRequest_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "HotelPackage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HotelServiceRequest" ADD CONSTRAINT "HotelServiceRequest_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES "Property"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HotelServiceRequest" ADD CONSTRAINT "HotelServiceRequest_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HotelServiceRequest" ADD CONSTRAINT "HotelServiceRequest_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HotelAccountPlan" ADD CONSTRAINT "HotelAccountPlan_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
