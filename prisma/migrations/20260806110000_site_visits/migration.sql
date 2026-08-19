-- CreateTable
CREATE TABLE "SiteVisit" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "path" TEXT NOT NULL,
    "referrer" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SiteVisit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SiteVisit_sessionId_idx" ON "SiteVisit"("sessionId");
CREATE INDEX "SiteVisit_createdAt_idx" ON "SiteVisit"("createdAt");
CREATE INDEX "SiteVisit_path_createdAt_idx" ON "SiteVisit"("path", "createdAt");
