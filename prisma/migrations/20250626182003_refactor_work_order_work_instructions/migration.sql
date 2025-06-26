/*
  Warnings:

  - You are about to drop the `StepActionExecution` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `WorkOrderStepExecution` table. If the table is not empty, all the data it contains will be lost.

*/

/*
  Data Migration Strategy:
  1. Create new WorkOrder instruction tables
  2. For each WorkOrderStepExecution, create WorkOrderWorkInstruction and WorkOrderWorkInstructionStep
  3. For each StepActionExecution, create WorkOrderWorkInstructionStepAction with execution data
  4. Drop old execution tables
*/

-- Step 1: Create new tables
CREATE TABLE "WorkOrderWorkInstruction" (
    "id" TEXT NOT NULL,
    "workOrderId" TEXT NOT NULL,
    "originalInstructionId" TEXT,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "baseInstructionNumber" TEXT,
    "versionNumber" TEXT NOT NULL DEFAULT '1',
    "instructionNumber" TEXT NOT NULL,
    "status" "InstructionStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkOrderWorkInstruction_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WorkOrderWorkInstructionStep" (
    "id" TEXT NOT NULL,
    "workOrderInstructionId" TEXT NOT NULL,
    "originalStepId" TEXT,
    "stepNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "instructions" TEXT NOT NULL,
    "estimatedLabourTime" INTEGER NOT NULL,
    "requiredTools" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "timeTaken" INTEGER,
    "status" "StepExecutionStatus" NOT NULL DEFAULT 'PENDING',
    "activeWorkers" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "WorkOrderWorkInstructionStep_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "WorkOrderWorkInstructionStepAction" (
    "id" TEXT NOT NULL,
    "stepId" TEXT NOT NULL,
    "originalActionId" TEXT,
    "description" TEXT NOT NULL,
    "notes" TEXT,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "signoffRoles" TEXT[],
    "targetValue" DOUBLE PRECISION,
    "tolerance" DOUBLE PRECISION,
    "unit" TEXT,
    "uploadedFileId" TEXT,
    "actionType" "ActionType" NOT NULL,
    "executedValue" DOUBLE PRECISION,
    "executionNotes" TEXT,
    "completedAt" TIMESTAMP(3),
    "completedBy" TEXT,
    "executionFileId" TEXT,

    CONSTRAINT "WorkOrderWorkInstructionStepAction_pkey" PRIMARY KEY ("id")
);

-- Step 2: Create indexes
CREATE INDEX "WorkOrderWorkInstruction_workOrderId_idx" ON "WorkOrderWorkInstruction"("workOrderId");
CREATE INDEX "WorkOrderWorkInstructionStep_workOrderInstructionId_idx" ON "WorkOrderWorkInstructionStep"("workOrderInstructionId");
CREATE UNIQUE INDEX "WorkOrderWorkInstructionStepAction_uploadedFileId_key" ON "WorkOrderWorkInstructionStepAction"("uploadedFileId");
CREATE UNIQUE INDEX "WorkOrderWorkInstructionStepAction_executionFileId_key" ON "WorkOrderWorkInstructionStepAction"("executionFileId");
CREATE INDEX "WorkOrderWorkInstructionStepAction_stepId_idx" ON "WorkOrderWorkInstructionStepAction"("stepId");

-- Step 3: Add foreign key constraints
ALTER TABLE "WorkOrderWorkInstruction" ADD CONSTRAINT "WorkOrderWorkInstruction_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkOrderWorkInstruction" ADD CONSTRAINT "WorkOrderWorkInstruction_originalInstructionId_fkey" FOREIGN KEY ("originalInstructionId") REFERENCES "WorkInstruction"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "WorkOrderWorkInstructionStep" ADD CONSTRAINT "WorkOrderWorkInstructionStep_workOrderInstructionId_fkey" FOREIGN KEY ("workOrderInstructionId") REFERENCES "WorkOrderWorkInstruction"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkOrderWorkInstructionStep" ADD CONSTRAINT "WorkOrderWorkInstructionStep_originalStepId_fkey" FOREIGN KEY ("originalStepId") REFERENCES "WorkInstructionStep"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "WorkOrderWorkInstructionStepAction" ADD CONSTRAINT "WorkOrderWorkInstructionStepAction_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "WorkOrderWorkInstructionStep"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "WorkOrderWorkInstructionStepAction" ADD CONSTRAINT "WorkOrderWorkInstructionStepAction_originalActionId_fkey" FOREIGN KEY ("originalActionId") REFERENCES "WorkInstructionStepAction"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "WorkOrderWorkInstructionStepAction" ADD CONSTRAINT "WorkOrderWorkInstructionStepAction_uploadedFileId_fkey" FOREIGN KEY ("uploadedFileId") REFERENCES "File"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "WorkOrderWorkInstructionStepAction" ADD CONSTRAINT "WorkOrderWorkInstructionStepAction_executionFileId_fkey" FOREIGN KEY ("executionFileId") REFERENCES "File"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Step 4: Migrate existing execution data
-- First, create WorkOrderWorkInstructions for each work order that has step executions
INSERT INTO "WorkOrderWorkInstruction" (
    "id", 
    "workOrderId", 
    "originalInstructionId", 
    "title", 
    "description", 
    "baseInstructionNumber", 
    "versionNumber", 
    "instructionNumber", 
    "status", 
    "createdAt", 
    "updatedAt"
)
SELECT DISTINCT
    gen_random_uuid() as "id",
    wo."id" as "workOrderId",
    wi."id" as "originalInstructionId",
    wi."title",
    wi."description",
    wi."baseInstructionNumber",
    wi."versionNumber",
    wi."instructionNumber",
    wi."status",
    wi."createdAt",
    wi."updatedAt"
FROM "WorkOrderStepExecution" wose
JOIN "WorkOrder" wo ON wose."workOrderId" = wo."id"
JOIN "WorkInstructionStep" wis ON wose."workInstructionStepId" = wis."id"
JOIN "WorkInstruction" wi ON wis."workInstructionId" = wi."id";

-- Then, create WorkOrderWorkInstructionSteps with execution data embedded
INSERT INTO "WorkOrderWorkInstructionStep" (
    "id",
    "workOrderInstructionId",
    "originalStepId",
    "stepNumber",
    "title",
    "instructions",
    "estimatedLabourTime",
    "requiredTools",
    "createdAt",
    "updatedAt",
    "completedAt",
    "timeTaken",
    "status",
    "activeWorkers"
)
SELECT 
    gen_random_uuid() as "id",
    wowi."id" as "workOrderInstructionId",
    wis."id" as "originalStepId",
    wis."stepNumber",
    wis."title",
    wis."instructions",
    wis."estimatedLabourTime",
    wis."requiredTools",
    wis."createdAt",
    wis."updatedAt",
    wose."completedAt",
    wose."timeTaken",
    wose."status",
    wose."activeWorkers"
FROM "WorkOrderStepExecution" wose
JOIN "WorkInstructionStep" wis ON wose."workInstructionStepId" = wis."id"
JOIN "WorkInstruction" wi ON wis."workInstructionId" = wi."id"
JOIN "WorkOrderWorkInstruction" wowi ON wose."workOrderId" = wowi."workOrderId" AND wi."id" = wowi."originalInstructionId";

-- Finally, create WorkOrderWorkInstructionStepActions with execution data embedded
INSERT INTO "WorkOrderWorkInstructionStepAction" (
    "id",
    "stepId",
    "originalActionId",
    "description",
    "notes",
    "isRequired",
    "signoffRoles",
    "targetValue",
    "tolerance",
    "unit",
    "uploadedFileId",
    "actionType",
    "executedValue",
    "executionNotes",
    "completedAt",
    "completedBy",
    "executionFileId"
)
SELECT 
    gen_random_uuid() as "id",
    wowis."id" as "stepId",
    wisa."id" as "originalActionId",
    wisa."description",
    wisa."notes",
    wisa."isRequired",
    wisa."signoffRoles",
    wisa."targetValue",
    wisa."tolerance",
    wisa."unit",
    wisa."uploadedFileId",
    wisa."actionType",
    sae."value" as "executedValue",
    sae."notes" as "executionNotes",
    sae."completedAt",
    sae."completedBy",
    sae."uploadedFileId" as "executionFileId"
FROM "StepActionExecution" sae
JOIN "WorkOrderStepExecution" wose ON sae."workOrderStepExecutionId" = wose."id"
JOIN "WorkInstructionStepAction" wisa ON sae."workInstructionStepActionId" = wisa."id"
JOIN "WorkInstructionStep" wis ON wisa."stepId" = wis."id"
JOIN "WorkInstruction" wi ON wis."workInstructionId" = wi."id"
JOIN "WorkOrderWorkInstruction" wowi ON wose."workOrderId" = wowi."workOrderId" AND wi."id" = wowi."originalInstructionId"
JOIN "WorkOrderWorkInstructionStep" wowis ON wowi."id" = wowis."workOrderInstructionId" AND wis."id" = wowis."originalStepId";

-- Step 5: Now safely drop the old tables
-- DropForeignKey
ALTER TABLE "StepActionExecution" DROP CONSTRAINT "StepActionExecution_uploadedFileId_fkey";
ALTER TABLE "StepActionExecution" DROP CONSTRAINT "StepActionExecution_workInstructionStepActionId_fkey";
ALTER TABLE "StepActionExecution" DROP CONSTRAINT "StepActionExecution_workOrderStepExecutionId_fkey";
ALTER TABLE "WorkOrderStepExecution" DROP CONSTRAINT "WorkOrderStepExecution_workInstructionStepId_fkey";
ALTER TABLE "WorkOrderStepExecution" DROP CONSTRAINT "WorkOrderStepExecution_workOrderId_fkey";

-- DropTable
DROP TABLE "StepActionExecution";
DROP TABLE "WorkOrderStepExecution";
