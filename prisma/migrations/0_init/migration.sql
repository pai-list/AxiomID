-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "KYCStatus" AS ENUM ('NONE', 'PENDING', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "AgentStatus" AS ENUM ('INACTIVE', 'ACTIVE', 'PAUSED', 'SLEEPING');

-- CreateEnum
CREATE TYPE "AgentMode" AS ENUM ('AUTONOMOUS', 'SUPERVISED', 'MANUAL');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'ESCROWED', 'RELEASED', 'REFUNDED');

-- CreateEnum
CREATE TYPE "SkillTier" AS ENUM ('BASIC_TOOL', 'ADVANCED_TOOL', 'ADVANCED_INFRASTRUCTURE', 'PRO', 'SOVEREIGN');

-- CreateEnum
CREATE TYPE "SkillStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'DEPRECATED');

-- CreateEnum
CREATE TYPE "EphemeralDidStatus" AS ENUM ('ACTIVE', 'EXPIRED', 'REVOKED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "walletAddress" VARCHAR(120) NOT NULL,
    "stellarAddress" VARCHAR(56),
    "piUid" VARCHAR(100),
    "piUsername" VARCHAR(100),
    "piAccessToken" TEXT,
    "xp" INTEGER NOT NULL DEFAULT 0,
    "tier" VARCHAR(50) NOT NULL DEFAULT 'Visitor',
    "did" VARCHAR(255),
    "didMethod" VARCHAR(50) DEFAULT 'did:axiom',
    "kycStatus" "KYCStatus" NOT NULL DEFAULT 'NONE',
    "kycProvider" TEXT,
    "kycAssurance" TEXT,
    "kycUidHash" TEXT,
    "kycVerifiedAt" TIMESTAMP(3),
    "metadata" TEXT,
    "lastActive" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserAgent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL DEFAULT 'My Agent',
    "description" VARCHAR(500),
    "avatarUrl" VARCHAR(500),
    "did" VARCHAR(255),
    "status" "AgentStatus" NOT NULL DEFAULT 'INACTIVE',
    "mode" "AgentMode" NOT NULL DEFAULT 'AUTONOMOUS',
    "lastActive" TIMESTAMP(3),
    "lastHeartbeat" TIMESTAMP(3),
    "activeUntil" TIMESTAMP(3),
    "memoryLimit" INTEGER NOT NULL DEFAULT 500,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserAgent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PiPayment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "txid" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "memo" VARCHAR(500),
    "metadata" TEXT,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "fromAddress" TEXT,
    "toAddress" TEXT,
    "network" TEXT NOT NULL DEFAULT 'pi',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PiPayment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Action" (
    "id" TEXT NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "xp" INTEGER NOT NULL,
    "metadata" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT NOT NULL,
    "hash" VARCHAR(64),
    "parentHash" VARCHAR(64),

    CONSTRAINT "Action_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "XpLedger" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "reason" VARCHAR(50) NOT NULL,
    "reference" TEXT,
    "balance" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "XpLedger_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AgentLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "agentId" TEXT,
    "level" VARCHAR(20) NOT NULL DEFAULT 'info',
    "source" VARCHAR(50) NOT NULL,
    "message" VARCHAR(2000) NOT NULL,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AgentLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Stamp" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "provider" VARCHAR(50) NOT NULL,
    "xpAwarded" INTEGER NOT NULL DEFAULT 0,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Stamp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Skill" (
    "id" TEXT NOT NULL,
    "slug" VARCHAR(100) NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "description" VARCHAR(1000),
    "manifestMd" TEXT NOT NULL,
    "agentScript" TEXT,
    "testSuite" TEXT,
    "tier" "SkillTier" NOT NULL DEFAULT 'BASIC_TOOL',
    "pricePi" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "version" VARCHAR(20) NOT NULL DEFAULT '1.0.0',
    "authorId" TEXT,
    "status" "SkillStatus" NOT NULL DEFAULT 'DRAFT',
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "installCount" INTEGER NOT NULL DEFAULT 0,
    "avgRating" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "ratingCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Skill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SkillInstallation" (
    "id" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "installedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',

    CONSTRAINT "SkillInstallation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SkillReview" (
    "id" TEXT NOT NULL,
    "skillId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "review" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SkillReview_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DelegatedTrust" (
    "id" TEXT NOT NULL,
    "fromDid" VARCHAR(255) NOT NULL,
    "toDid" VARCHAR(255) NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DelegatedTrust_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EphemeralDid" (
    "id" TEXT NOT NULL,
    "did" VARCHAR(255) NOT NULL,
    "parentDid" VARCHAR(255),
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "status" "EphemeralDidStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EphemeralDid_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SelfReviewLog" (
    "id" TEXT NOT NULL,
    "actionName" VARCHAR(255) NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "critique" TEXT NOT NULL,
    "telemetry" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SelfReviewLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_walletAddress_key" ON "User"("walletAddress");

-- CreateIndex
CREATE UNIQUE INDEX "User_piUid_key" ON "User"("piUid");

-- CreateIndex
CREATE UNIQUE INDEX "User_did_key" ON "User"("did");

-- CreateIndex
CREATE UNIQUE INDEX "UserAgent_userId_key" ON "UserAgent"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserAgent_publicId_key" ON "UserAgent"("publicId");

-- CreateIndex
CREATE UNIQUE INDEX "PiPayment_paymentId_key" ON "PiPayment"("paymentId");

-- CreateIndex
CREATE INDEX "PiPayment_userId_idx" ON "PiPayment"("userId");

-- CreateIndex
CREATE INDEX "PiPayment_status_idx" ON "PiPayment"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Action_hash_key" ON "Action"("hash");

-- CreateIndex
CREATE INDEX "Action_userId_idx" ON "Action"("userId");

-- CreateIndex
CREATE INDEX "Action_type_idx" ON "Action"("type");

-- CreateIndex
CREATE UNIQUE INDEX "Action_userId_type_key" ON "Action"("userId", "type");

-- CreateIndex
CREATE INDEX "XpLedger_userId_idx" ON "XpLedger"("userId");

-- CreateIndex
CREATE INDEX "XpLedger_createdAt_idx" ON "XpLedger"("createdAt");

-- CreateIndex
CREATE INDEX "AgentLog_userId_idx" ON "AgentLog"("userId");

-- CreateIndex
CREATE INDEX "AgentLog_agentId_idx" ON "AgentLog"("agentId");

-- CreateIndex
CREATE INDEX "AgentLog_level_idx" ON "AgentLog"("level");

-- CreateIndex
CREATE INDEX "AgentLog_createdAt_idx" ON "AgentLog"("createdAt");

-- CreateIndex
CREATE INDEX "Stamp_userId_idx" ON "Stamp"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Stamp_userId_type_key" ON "Stamp"("userId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "Skill_slug_key" ON "Skill"("slug");

-- CreateIndex
CREATE INDEX "Skill_tier_idx" ON "Skill"("tier");

-- CreateIndex
CREATE INDEX "Skill_status_idx" ON "Skill"("status");

-- CreateIndex
CREATE INDEX "Skill_isPublished_idx" ON "Skill"("isPublished");

-- CreateIndex
CREATE INDEX "Skill_slug_idx" ON "Skill"("slug");

-- CreateIndex
CREATE INDEX "SkillInstallation_skillId_idx" ON "SkillInstallation"("skillId");

-- CreateIndex
CREATE INDEX "SkillInstallation_agentId_idx" ON "SkillInstallation"("agentId");

-- CreateIndex
CREATE UNIQUE INDEX "SkillInstallation_skillId_agentId_key" ON "SkillInstallation"("skillId", "agentId");

-- CreateIndex
CREATE INDEX "SkillReview_skillId_idx" ON "SkillReview"("skillId");

-- CreateIndex
CREATE INDEX "SkillReview_userId_idx" ON "SkillReview"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "SkillReview_skillId_userId_key" ON "SkillReview"("skillId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "DelegatedTrust_fromDid_toDid_key" ON "DelegatedTrust"("fromDid", "toDid");

-- CreateIndex
CREATE UNIQUE INDEX "EphemeralDid_did_key" ON "EphemeralDid"("did");

-- CreateIndex
CREATE INDEX "EphemeralDid_userId_idx" ON "EphemeralDid"("userId");

-- CreateIndex
CREATE INDEX "SelfReviewLog_actionName_idx" ON "SelfReviewLog"("actionName");

-- AddForeignKey
ALTER TABLE "UserAgent" ADD CONSTRAINT "UserAgent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PiPayment" ADD CONSTRAINT "PiPayment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Action" ADD CONSTRAINT "Action_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "XpLedger" ADD CONSTRAINT "XpLedger_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentLog" ADD CONSTRAINT "AgentLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AgentLog" ADD CONSTRAINT "AgentLog_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "UserAgent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Stamp" ADD CONSTRAINT "Stamp_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Skill" ADD CONSTRAINT "Skill_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillInstallation" ADD CONSTRAINT "SkillInstallation_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillInstallation" ADD CONSTRAINT "SkillInstallation_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "UserAgent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillReview" ADD CONSTRAINT "SkillReview_skillId_fkey" FOREIGN KEY ("skillId") REFERENCES "Skill"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SkillReview" ADD CONSTRAINT "SkillReview_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DelegatedTrust" ADD CONSTRAINT "DelegatedTrust_fromDid_fkey" FOREIGN KEY ("fromDid") REFERENCES "User"("did") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DelegatedTrust" ADD CONSTRAINT "DelegatedTrust_toDid_fkey" FOREIGN KEY ("toDid") REFERENCES "User"("did") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EphemeralDid" ADD CONSTRAINT "EphemeralDid_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

