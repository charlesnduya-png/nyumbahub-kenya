-- Admin-configurable hotel plan tier prices
CREATE TABLE "HotelPlanPriceConfig" (
    "tier" "HotelPlanTier" NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'KES',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HotelPlanPriceConfig_pkey" PRIMARY KEY ("tier")
);
