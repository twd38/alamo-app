/*
  Warnings:

  - You are about to drop the column `baseInstructionNumber` on the `WorkOrderWorkInstruction` table. All the data in the column will be lost.
  - You are about to drop the column `instructionNumber` on the `WorkOrderWorkInstruction` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `WorkOrderWorkInstruction` table. All the data in the column will be lost.
  - You are about to drop the column `versionNumber` on the `WorkOrderWorkInstruction` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[workOrderId]` on the table `WorkOrderWorkInstruction` will be added. If there are existing duplicate values, this will fail.

*/

-- Step 1: Handle duplicate workOrderId values by keeping only the first instruction per work order
-- Delete duplicate WorkOrderWorkInstructions, keeping only the first one (by id) for each workOrderId
DELETE FROM "WorkOrderWorkInstruction" 
WHERE id NOT IN (
  SELECT DISTINCT ON ("workOrderId") id 
  FROM "WorkOrderWorkInstruction" 
  ORDER BY "workOrderId", id
);

-- Step 2: Delete orphaned WorkOrderWorkInstructionStep records that reference deleted instructions
DELETE FROM "WorkOrderWorkInstructionStep" 
WHERE "workOrderInstructionId" NOT IN (
  SELECT id FROM "WorkOrderWorkInstruction"
);

-- Step 3: Delete orphaned WorkOrderWorkInstructionStepAction records that reference deleted steps
DELETE FROM "WorkOrderWorkInstructionStepAction" 
WHERE "stepId" NOT IN (
  SELECT id FROM "WorkOrderWorkInstructionStep"
);

-- Step 4: Drop the non-unique index
DROP INDEX "WorkOrderWorkInstruction_workOrderId_idx";

-- Step 5: Remove the versioning columns
ALTER TABLE "WorkOrderWorkInstruction" DROP COLUMN "baseInstructionNumber",
DROP COLUMN "instructionNumber",
DROP COLUMN "status",
DROP COLUMN "versionNumber";

-- Step 6: Create the unique constraint
CREATE UNIQUE INDEX "WorkOrderWorkInstruction_workOrderId_key" ON "WorkOrderWorkInstruction"("workOrderId");
