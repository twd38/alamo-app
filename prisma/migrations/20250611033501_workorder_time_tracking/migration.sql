/*
  Warnings:

  - You are about to drop the column `timeEstimate` on the `WorkOrder` table. All the data in the column will be lost.
  - You are about to drop the column `timeEstimateMinutes` on the `WorkOrder` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "WorkOrder" DROP COLUMN "timeEstimate",
DROP COLUMN "timeEstimateMinutes";
