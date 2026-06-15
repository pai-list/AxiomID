-- Migration: Add HarvestResult and AgentPresence models
-- These replace the D1 edge tables with Prisma-managed PostgreSQL tables

-- Harvest results from Perplexity queries
CREATE TABLE IF NOT EXISTS "HarvestResult" (
    "id" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "result" TEXT NOT NULL,
    "citations" TEXT,
    "userDid" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "HarvestResult_pkey" PRIMARY KEY ("id")
);

-- Indexes for HarvestResult
CREATE INDEX IF NOT EXISTS "HarvestResult_userDid_idx" ON "HarvestResult"("userDid");
CREATE INDEX IF NOT EXISTS "HarvestResult_createdAt_idx" ON "HarvestResult"("createdAt");

-- Agent presence tracking
CREATE TABLE IF NOT EXISTS "AgentPresence" (
    "agentId" TEXT NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'offline',
    "lastHeartbeat" BIGINT,
    "metadata" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AgentPresence_pkey" PRIMARY KEY ("agentId")
);
