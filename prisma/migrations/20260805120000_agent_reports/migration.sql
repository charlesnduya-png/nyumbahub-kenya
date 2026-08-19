-- CreateEnum
CREATE TYPE "AgentReportReason" AS ENUM ('FRAUD', 'HARASSMENT', 'MISLEADING', 'UNRESPONSIVE', 'OTHER');

-- CreateEnum
CREATE TYPE "AgentReportStatus" AS ENUM ('PENDING', 'REVIEWED', 'DISMISSED');

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'AGENT_REPORT';

-- CreateTable
CREATE TABLE "AgentReport" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "reporterId" TEXT NOT NULL,
    "reason" "AgentReportReason" NOT NULL,
    "details" TEXT,
    "status" "AgentReportStatus" NOT NULL DEFAULT 'PENDING',
    "adminNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgentReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AgentReport_agentId_idx" ON "AgentReport"("agentId");

-- CreateIndex
CREATE INDEX "AgentReport_status_idx" ON "AgentReport"("status");

-- CreateIndex
CREATE INDEX "AgentReport_reporterId_idx" ON "AgentReport"("reporterId");

-- AddForeignKey
ALTER TABLE "AgentReport" ADD CONSTRAINT "AgentReport_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentReport" ADD CONSTRAINT "AgentReport_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
