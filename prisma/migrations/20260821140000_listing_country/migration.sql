-- AlterTable
ALTER TABLE "Property" ADD COLUMN IF NOT EXISTS "country" TEXT NOT NULL DEFAULT 'Kenya';
ALTER TABLE "RentalPlot" ADD COLUMN IF NOT EXISTS "country" TEXT NOT NULL DEFAULT 'Kenya';

CREATE INDEX IF NOT EXISTS "Property_country_idx" ON "Property"("country");
CREATE INDEX IF NOT EXISTS "RentalPlot_country_idx" ON "RentalPlot"("country");
