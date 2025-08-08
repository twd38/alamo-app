-- CreateEnum
CREATE TYPE "DependencyType" AS ENUM ('FINISH_TO_START', 'START_TO_START', 'FINISH_TO_FINISH', 'START_TO_FINISH');

-- CreateEnum
CREATE TYPE "BlockedReason" AS ENUM ('WAITING_PREDECESSOR', 'MATERIAL_UNAVAILABLE', 'TOOL_UNAVAILABLE', 'WORK_CENTER_BUSY', 'OPERATOR_UNAVAILABLE', 'QUALITY_HOLD', 'SETUP_REQUIRED');

-- CreateTable
CREATE TABLE "OperationDependency" (
    "id" TEXT NOT NULL,
    "workOrderOperationId" TEXT NOT NULL,
    "dependsOnOperationId" TEXT NOT NULL,
    "dependencyType" "DependencyType" NOT NULL DEFAULT 'FINISH_TO_START',
    "lagTime" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OperationDependency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OperationReadiness" (
    "id" TEXT NOT NULL,
    "workOrderOperationId" TEXT NOT NULL,
    "isReady" BOOLEAN NOT NULL DEFAULT false,
    "blockedReasons" "BlockedReason"[],
    "estimatedReadyTime" TIMESTAMP(3),
    "lastCalculated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OperationReadiness_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkCenterQueue" (
    "id" TEXT NOT NULL,
    "workCenterId" TEXT NOT NULL,
    "operationId" TEXT NOT NULL,
    "queuePosition" INTEGER NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "estimatedWaitTime" INTEGER,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkCenterQueue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OperationDependency_workOrderOperationId_idx" ON "OperationDependency"("workOrderOperationId");

-- CreateIndex
CREATE INDEX "OperationDependency_dependsOnOperationId_idx" ON "OperationDependency"("dependsOnOperationId");

-- CreateIndex
CREATE UNIQUE INDEX "OperationDependency_workOrderOperationId_dependsOnOperation_key" ON "OperationDependency"("workOrderOperationId", "dependsOnOperationId");

-- CreateIndex
CREATE UNIQUE INDEX "OperationReadiness_workOrderOperationId_key" ON "OperationReadiness"("workOrderOperationId");

-- CreateIndex
CREATE INDEX "OperationReadiness_isReady_idx" ON "OperationReadiness"("isReady");

-- CreateIndex
CREATE INDEX "OperationReadiness_workOrderOperationId_idx" ON "OperationReadiness"("workOrderOperationId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkCenterQueue_operationId_key" ON "WorkCenterQueue"("operationId");

-- CreateIndex
CREATE INDEX "WorkCenterQueue_workCenterId_idx" ON "WorkCenterQueue"("workCenterId");

-- CreateIndex
CREATE INDEX "WorkCenterQueue_operationId_idx" ON "WorkCenterQueue"("operationId");

-- CreateIndex
CREATE INDEX "WorkCenterQueue_priority_idx" ON "WorkCenterQueue"("priority");

-- CreateIndex
CREATE UNIQUE INDEX "WorkCenterQueue_workCenterId_queuePosition_key" ON "WorkCenterQueue"("workCenterId", "queuePosition");

-- AddForeignKey
ALTER TABLE "OperationDependency" ADD CONSTRAINT "OperationDependency_workOrderOperationId_fkey" FOREIGN KEY ("workOrderOperationId") REFERENCES "WorkOrderOperation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OperationDependency" ADD CONSTRAINT "OperationDependency_dependsOnOperationId_fkey" FOREIGN KEY ("dependsOnOperationId") REFERENCES "WorkOrderOperation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OperationReadiness" ADD CONSTRAINT "OperationReadiness_workOrderOperationId_fkey" FOREIGN KEY ("workOrderOperationId") REFERENCES "WorkOrderOperation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkCenterQueue" ADD CONSTRAINT "WorkCenterQueue_workCenterId_fkey" FOREIGN KEY ("workCenterId") REFERENCES "WorkCenter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkCenterQueue" ADD CONSTRAINT "WorkCenterQueue_operationId_fkey" FOREIGN KEY ("operationId") REFERENCES "WorkOrderOperation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
