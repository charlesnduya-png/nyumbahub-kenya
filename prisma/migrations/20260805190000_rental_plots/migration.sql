-- CreateTable
CREATE TABLE "RentalPlot" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "county" TEXT NOT NULL,
    "town" TEXT NOT NULL,
    "estate" TEXT,
    "address" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "ownerId" TEXT NOT NULL,
    "agentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RentalPlot_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Property" ADD COLUMN "rentalPlotId" TEXT;
ALTER TABLE "Property" ADD COLUMN "unitLabel" TEXT;

-- CreateIndex
CREATE INDEX "RentalPlot_ownerId_idx" ON "RentalPlot"("ownerId");
CREATE INDEX "RentalPlot_agentId_idx" ON "RentalPlot"("agentId");
CREATE INDEX "RentalPlot_county_town_idx" ON "RentalPlot"("county", "town");
CREATE INDEX "Property_rentalPlotId_idx" ON "Property"("rentalPlotId");

-- AddForeignKey
ALTER TABLE "RentalPlot" ADD CONSTRAINT "RentalPlot_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "RentalPlot" ADD CONSTRAINT "RentalPlot_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Property" ADD CONSTRAINT "Property_rentalPlotId_fkey" FOREIGN KEY ("rentalPlotId") REFERENCES "RentalPlot"("id") ON DELETE SET NULL ON UPDATE CASCADE;