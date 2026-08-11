-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "approvalStatus" TEXT NOT NULL DEFAULT 'pending_approval',
ADD COLUMN     "rejectionReason" TEXT;

-- CreateTable
CREATE TABLE "TaskChecklistItem" (
    "id" TEXT NOT NULL,
    "taskId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "itemStatus" TEXT NOT NULL DEFAULT 'pending',
    "justification" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TaskChecklistItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TaskChecklistItem_taskId_key_key" ON "TaskChecklistItem"("taskId", "key");

-- AddForeignKey
ALTER TABLE "TaskChecklistItem" ADD CONSTRAINT "TaskChecklistItem_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;
