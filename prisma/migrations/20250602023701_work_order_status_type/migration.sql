/*
  Warnings:

  - You are about to drop the column `status` on the `Task` table. All the data in the column will be lost.
  - Changed the type of `status` on the `WorkOrder` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "WorkOrderStatus" AS ENUM ('PAUSED', 'TODO', 'IN_PROGRESS', 'COMPLETED', 'SCRAPPED');

-- AlterTable
ALTER TABLE "Task" DROP COLUMN "status";

-- AlterTable
ALTER TABLE "WorkOrder" DROP COLUMN "status",
ADD COLUMN     "status" "WorkOrderStatus" NOT NULL;
