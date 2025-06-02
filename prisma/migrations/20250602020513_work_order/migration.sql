/*
  Warnings:

  - You are about to drop the column `imageUrl` on the `WorkOrder` table. All the data in the column will be lost.
  - You are about to drop the column `ownerId` on the `WorkOrder` table. All the data in the column will be lost.
  - You are about to drop the column `partName` on the `WorkOrder` table. All the data in the column will be lost.
  - The `dueDate` column on the `WorkOrder` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `partId` to the `WorkOrder` table without a default value. This is not possible if the table is not empty.
  - Added the required column `partQty` to the `WorkOrder` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "WorkOrder" DROP CONSTRAINT "WorkOrder_ownerId_fkey";

-- AlterTable
ALTER TABLE "WorkOrder" DROP COLUMN "imageUrl",
DROP COLUMN "ownerId",
DROP COLUMN "partName",
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "partId" TEXT NOT NULL,
ADD COLUMN     "partQty" INTEGER NOT NULL,
DROP COLUMN "dueDate",
ADD COLUMN     "dueDate" TIMESTAMP(3);

-- AddForeignKey
ALTER TABLE "WorkOrder" ADD CONSTRAINT "WorkOrder_partId_fkey" FOREIGN KEY ("partId") REFERENCES "Part"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
