-- CreateEnum
CREATE TYPE "OperationStatus" AS ENUM ('PENDING', 'SETUP', 'RUNNING', 'PAUSED', 'COMPLETED', 'SKIPPED');

-- CreateTable
CREATE TABLE "WorkOrderRouting" (
    "id" TEXT NOT NULL,
    "workOrderId" TEXT NOT NULL,
    "routingId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkOrderRouting_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkOrderOperation" (
    "id" TEXT NOT NULL,
    "workOrderRoutingId" TEXT NOT NULL,
    "sequenceNumber" INTEGER NOT NULL,
    "operationId" TEXT NOT NULL,
    "workCenterId" TEXT NOT NULL,
    "status" "OperationStatus" NOT NULL DEFAULT 'PENDING',
    "plannedQty" INTEGER NOT NULL,
    "completedQty" INTEGER NOT NULL DEFAULT 0,
    "scrappedQty" INTEGER NOT NULL DEFAULT 0,
    "plannedSetupTime" INTEGER NOT NULL,
    "plannedRunTime" INTEGER NOT NULL,
    "actualSetupTime" INTEGER,
    "actualRunTime" INTEGER,
    "startedAt" TIMESTAMP(3),
    "setupCompletedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "assignedUserId" TEXT,
    "setupByUserId" TEXT,
    "completedByUserId" TEXT,
    "notes" TEXT,
    "priority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkOrderOperation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WorkOrderRouting_workOrderId_key" ON "WorkOrderRouting"("workOrderId");

-- CreateIndex
CREATE INDEX "WorkOrderRouting_routingId_idx" ON "WorkOrderRouting"("routingId");

-- CreateIndex
CREATE INDEX "WorkOrderOperation_workOrderRoutingId_idx" ON "WorkOrderOperation"("workOrderRoutingId");

-- CreateIndex
CREATE INDEX "WorkOrderOperation_operationId_idx" ON "WorkOrderOperation"("operationId");

-- CreateIndex
CREATE INDEX "WorkOrderOperation_workCenterId_idx" ON "WorkOrderOperation"("workCenterId");

-- CreateIndex
CREATE INDEX "WorkOrderOperation_status_idx" ON "WorkOrderOperation"("status");

-- CreateIndex
CREATE INDEX "WorkOrderOperation_assignedUserId_idx" ON "WorkOrderOperation"("assignedUserId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkOrderOperation_workOrderRoutingId_sequenceNumber_key" ON "WorkOrderOperation"("workOrderRoutingId", "sequenceNumber");

-- AddForeignKey
ALTER TABLE "WorkOrderRouting" ADD CONSTRAINT "WorkOrderRouting_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkOrderRouting" ADD CONSTRAINT "WorkOrderRouting_routingId_fkey" FOREIGN KEY ("routingId") REFERENCES "Routing"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkOrderOperation" ADD CONSTRAINT "WorkOrderOperation_workOrderRoutingId_fkey" FOREIGN KEY ("workOrderRoutingId") REFERENCES "WorkOrderRouting"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkOrderOperation" ADD CONSTRAINT "WorkOrderOperation_operationId_fkey" FOREIGN KEY ("operationId") REFERENCES "Operation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkOrderOperation" ADD CONSTRAINT "WorkOrderOperation_workCenterId_fkey" FOREIGN KEY ("workCenterId") REFERENCES "WorkCenter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkOrderOperation" ADD CONSTRAINT "WorkOrderOperation_assignedUserId_fkey" FOREIGN KEY ("assignedUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkOrderOperation" ADD CONSTRAINT "WorkOrderOperation_setupByUserId_fkey" FOREIGN KEY ("setupByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkOrderOperation" ADD CONSTRAINT "WorkOrderOperation_completedByUserId_fkey" FOREIGN KEY ("completedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
