/*
  Warnings:

  - Made the column `adUsername` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "User_email_key";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "telegramChatId" TEXT,
ALTER COLUMN "role" SET DEFAULT 'dept_user',
ALTER COLUMN "adUsername" SET NOT NULL;

-- CreateTable
CREATE TABLE "GitHubEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "deliveryId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "action" TEXT,
    "repoName" TEXT NOT NULL,
    "refName" TEXT,
    "commitSha" TEXT,
    "hasDiff" BOOLEAN NOT NULL DEFAULT false,
    "xpAwarded" INTEGER NOT NULL DEFAULT 0,
    "processedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GitHubEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FieldTask" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "xpBase" INTEGER NOT NULL,
    "slaMinutes" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FieldTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FieldTaskSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "fieldTaskId" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "stoppedAt" TIMESTAMP(3),
    "durationMin" INTEGER,
    "slaStatus" TEXT,
    "xpAwarded" INTEGER NOT NULL DEFAULT 0,
    "glpiTicketId" TEXT,

    CONSTRAINT "FieldTaskSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "XpTransaction" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "refId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "XpTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommissionCycle" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "totalXp" INTEGER NOT NULL,
    "tier" TEXT NOT NULL,
    "commissionAmt" DECIMAL(10,2) NOT NULL,
    "closedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentToTheo" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "CommissionCycle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommissionConfig" (
    "id" TEXT NOT NULL,
    "tier" TEXT NOT NULL,
    "minXp" INTEGER NOT NULL,
    "maxXp" INTEGER,
    "amount" DECIMAL(10,2) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommissionConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "GitHubEvent_deliveryId_key" ON "GitHubEvent"("deliveryId");

-- CreateIndex
CREATE INDEX "GitHubEvent_userId_processedAt_idx" ON "GitHubEvent"("userId", "processedAt");

-- CreateIndex
CREATE INDEX "FieldTaskSession_userId_startedAt_idx" ON "FieldTaskSession"("userId", "startedAt");

-- CreateIndex
CREATE INDEX "XpTransaction_userId_createdAt_idx" ON "XpTransaction"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "XpTransaction_userId_category_idx" ON "XpTransaction"("userId", "category");

-- CreateIndex
CREATE UNIQUE INDEX "CommissionCycle_userId_period_key" ON "CommissionCycle"("userId", "period");

-- CreateIndex
CREATE UNIQUE INDEX "CommissionConfig_tier_key" ON "CommissionConfig"("tier");

-- AddForeignKey
ALTER TABLE "GitHubEvent" ADD CONSTRAINT "GitHubEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FieldTaskSession" ADD CONSTRAINT "FieldTaskSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FieldTaskSession" ADD CONSTRAINT "FieldTaskSession_fieldTaskId_fkey" FOREIGN KEY ("fieldTaskId") REFERENCES "FieldTask"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "XpTransaction" ADD CONSTRAINT "XpTransaction_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommissionCycle" ADD CONSTRAINT "CommissionCycle_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
