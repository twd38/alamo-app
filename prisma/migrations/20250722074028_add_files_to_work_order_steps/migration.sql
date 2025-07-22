-- AlterTable
ALTER TABLE "File" ADD COLUMN     "workOrderStepId" TEXT;

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_workOrderStepId_fkey" FOREIGN KEY ("workOrderStepId") REFERENCES "WorkOrderWorkInstructionStep"("id") ON DELETE SET NULL ON UPDATE CASCADE;
