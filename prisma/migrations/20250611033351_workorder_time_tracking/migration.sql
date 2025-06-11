-- CreateEnum
CREATE TYPE "StepExecutionStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED');

-- AlterTable
ALTER TABLE "WorkOrder" ADD COLUMN     "timeEstimateMinutes" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "WorkOrderStepExecution" (
    "id" TEXT NOT NULL,
    "workOrderId" TEXT NOT NULL,
    "workInstructionStepId" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3),
    "timeTaken" INTEGER,
    "status" "StepExecutionStatus" NOT NULL DEFAULT 'PENDING',
    "activeWorkers" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "WorkOrderStepExecution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkOrderTimeEntry" (
    "id" TEXT NOT NULL,
    "workOrderId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "clockInTime" TIMESTAMP(3) NOT NULL,
    "clockOutTime" TIMESTAMP(3),
    "sessionNumber" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "WorkOrderTimeEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StepActionExecution" (
    "id" TEXT NOT NULL,
    "workOrderStepExecutionId" TEXT NOT NULL,
    "workInstructionStepActionId" TEXT NOT NULL,
    "value" DOUBLE PRECISION,
    "notes" TEXT,
    "completedAt" TIMESTAMP(3),
    "completedBy" TEXT,
    "uploadedFileId" TEXT,

    CONSTRAINT "StepActionExecution_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WorkOrderStepExecution_workOrderId_workInstructionStepId_key" ON "WorkOrderStepExecution"("workOrderId", "workInstructionStepId");

-- CreateIndex
CREATE INDEX "WorkOrderTimeEntry_workOrderId_idx" ON "WorkOrderTimeEntry"("workOrderId");

-- CreateIndex
CREATE INDEX "WorkOrderTimeEntry_userId_idx" ON "WorkOrderTimeEntry"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkOrderTimeEntry_workOrderId_userId_clockInTime_key" ON "WorkOrderTimeEntry"("workOrderId", "userId", "clockInTime");

-- CreateIndex
CREATE UNIQUE INDEX "StepActionExecution_uploadedFileId_key" ON "StepActionExecution"("uploadedFileId");

-- CreateIndex
CREATE UNIQUE INDEX "StepActionExecution_workOrderStepExecutionId_workInstructio_key" ON "StepActionExecution"("workOrderStepExecutionId", "workInstructionStepActionId");

-- AddForeignKey
ALTER TABLE "WorkOrderStepExecution" ADD CONSTRAINT "WorkOrderStepExecution_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkOrderStepExecution" ADD CONSTRAINT "WorkOrderStepExecution_workInstructionStepId_fkey" FOREIGN KEY ("workInstructionStepId") REFERENCES "WorkInstructionStep"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkOrderTimeEntry" ADD CONSTRAINT "WorkOrderTimeEntry_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkOrderTimeEntry" ADD CONSTRAINT "WorkOrderTimeEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StepActionExecution" ADD CONSTRAINT "StepActionExecution_workOrderStepExecutionId_fkey" FOREIGN KEY ("workOrderStepExecutionId") REFERENCES "WorkOrderStepExecution"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StepActionExecution" ADD CONSTRAINT "StepActionExecution_workInstructionStepActionId_fkey" FOREIGN KEY ("workInstructionStepActionId") REFERENCES "WorkInstructionStepAction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StepActionExecution" ADD CONSTRAINT "StepActionExecution_uploadedFileId_fkey" FOREIGN KEY ("uploadedFileId") REFERENCES "File"("id") ON DELETE SET NULL ON UPDATE CASCADE;
