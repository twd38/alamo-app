/*
  Warnings:

  - You are about to drop the column `clockInTime` on the `WorkOrderTimeEntry` table. All the data in the column will be lost.
  - You are about to drop the column `clockOutTime` on the `WorkOrderTimeEntry` table. All the data in the column will be lost.
  - You are about to drop the column `sessionNumber` on the `WorkOrderTimeEntry` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[workOrderId,userId,startTime]` on the table `WorkOrderTimeEntry` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `startTime` to the `WorkOrderTimeEntry` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "WorkOrderTimeEntry_workOrderId_userId_clockInTime_key";

-- AlterTable
ALTER TABLE "WorkOrder" ADD COLUMN     "timeTaken" INTEGER DEFAULT 0;

-- AlterTable
ALTER TABLE "WorkOrderTimeEntry" DROP COLUMN "clockInTime",
DROP COLUMN "clockOutTime",
DROP COLUMN "sessionNumber",
ADD COLUMN     "startTime" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "stopTime" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "ClockInEntry" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "clockInTime" TIMESTAMP(3) NOT NULL,
    "clockOutTime" TIMESTAMP(3),
    "workOrderId" TEXT NOT NULL,

    CONSTRAINT "ClockInEntry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WorkOrderTimeEntry_workOrderId_userId_startTime_key" ON "WorkOrderTimeEntry"("workOrderId", "userId", "startTime");

-- AddForeignKey
ALTER TABLE "ClockInEntry" ADD CONSTRAINT "ClockInEntry_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "WorkOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ClockInEntry" ADD CONSTRAINT "ClockInEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
