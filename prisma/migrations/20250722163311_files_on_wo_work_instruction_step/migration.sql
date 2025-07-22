/*
  Warnings:

  - You are about to drop the column `workOrderStepId` on the `File` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "File" DROP CONSTRAINT "File_workOrderStepId_fkey";

-- AlterTable
ALTER TABLE "File" DROP COLUMN "workOrderStepId",
ADD COLUMN     "workOrderWorkInstructionStepId" TEXT;

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_workOrderWorkInstructionStepId_fkey" FOREIGN KEY ("workOrderWorkInstructionStepId") REFERENCES "WorkOrderWorkInstructionStep"("id") ON DELETE SET NULL ON UPDATE CASCADE;
