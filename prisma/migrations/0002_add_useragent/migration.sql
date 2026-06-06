-- Create UserAgent table
CREATE TABLE "UserAgent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "publicId" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'My Agent',
    "status" TEXT NOT NULL DEFAULT 'inactive',
    "apiKeyHash" TEXT,
    "permissions" TEXT,
    "lastActive" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserAgent_pkey" PRIMARY KEY ("id")
);

-- Add unique constraints
CREATE UNIQUE INDEX "UserAgent_userId_key" ON "UserAgent"("userId");
CREATE UNIQUE INDEX "UserAgent_publicId_key" ON "UserAgent"("publicId");

-- Add foreign key
ALTER TABLE "UserAgent" ADD CONSTRAINT "UserAgent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
