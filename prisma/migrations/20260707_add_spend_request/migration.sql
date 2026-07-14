-- CreateTable
CREATE TABLE "SpendRequest" (
    "id" TEXT NOT NULL,
    "agentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" DECIMAL(20,8) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'PI',
    "description" VARCHAR(500) NOT NULL,
    "context" TEXT NOT NULL,
    "items" JSONB,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "rejectionReason" VARCHAR(500),
    "paymentId" TEXT,
    "txid" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SpendRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SpendRequest_paymentId_key" ON "SpendRequest"("paymentId");

-- CreateIndex
CREATE INDEX "SpendRequest_agentId_idx" ON "SpendRequest"("agentId");

-- CreateIndex
CREATE INDEX "SpendRequest_userId_idx" ON "SpendRequest"("userId");

-- CreateIndex
CREATE INDEX "SpendRequest_status_idx" ON "SpendRequest"("status");

-- AddForeignKey
ALTER TABLE "SpendRequest" ADD CONSTRAINT "SpendRequest_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "UserAgent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpendRequest" ADD CONSTRAINT "SpendRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
