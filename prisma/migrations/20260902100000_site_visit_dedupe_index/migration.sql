-- Dedupe lookups: sessionId + path + createdAt (visit API throttling)
CREATE INDEX "SiteVisit_sessionId_path_createdAt_idx" ON "SiteVisit"("sessionId", "path", "createdAt");
