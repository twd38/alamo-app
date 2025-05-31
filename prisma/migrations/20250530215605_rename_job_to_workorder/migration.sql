/*
  Warnings:

  - You are about to drop the column `jobId` on the `File` table. All the data in the column will be lost.
  - You are about to drop the `Job` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `JobAssignee` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "File" DROP CONSTRAINT "File_jobId_fkey";

-- DropForeignKey
ALTER TABLE "Job" DROP CONSTRAINT "Job_createdById_fkey";

-- DropForeignKey
ALTER TABLE "Job" DROP CONSTRAINT "Job_ownerId_fkey";

-- DropForeignKey
ALTER TABLE "JobAssignee" DROP CONSTRAINT "JobAssignee_jobId_fkey";

-- DropForeignKey
ALTER TABLE "JobAssignee" DROP CONSTRAINT "JobAssignee_userId_fkey";

-- AlterTable
ALTER TABLE "File" DROP COLUMN "jobId",
ADD COLUMN     "workOrderId" TEXT;

-- DropTable
DROP TABLE "Job";

-- DropTable
DROP TABLE "JobAssignee";

-- CreateTable
CREATE TABLE "WorkOrder" (
    "id" TEXT NOT NULL,
    "workOrderNumber" TEXT NOT NULL,
    "partName" TEXT NOT NULL,
    "operation" TEXT NOT NULL,
    "status" "Status" NOT NULL,
    "timeEstimate" TEXT NOT NULL,
    "dueDate" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "deletedOn" TIMESTAMP(3),

    CONSTRAINT "WorkOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkOrderAssignee" (
    "workOrderId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "WorkOrderAssignee_pkey" PRIMARY KEY ("workOrderId","userId")
);

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkOrder" ADD CONSTRAINT "WorkOrder_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkOrder" ADD CONSTRAINT "WorkOrder_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkOrderAssignee" ADD CONSTRAINT "WorkOrderAssignee_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkOrderAssignee" ADD CONSTRAINT "WorkOrderAssignee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
