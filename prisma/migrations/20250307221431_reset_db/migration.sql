/*
  Warnings:

  - You are about to drop the column `parentVersionId` on the `BOMPart` table. All the data in the column will be lost.
  - You are about to drop the column `versionId` on the `BOMPart` table. All the data in the column will be lost.
  - You are about to drop the column `partVersionId` on the `File` table. All the data in the column will be lost.
  - You are about to drop the column `versionId` on the `Inventory` table. All the data in the column will be lost.
  - You are about to drop the column `versionId` on the `InventoryTransaction` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `Part` table. All the data in the column will be lost.
  - You are about to drop the column `deletedAt` on the `Part` table. All the data in the column will be lost.
  - You are about to drop the column `latestVersionId` on the `Part` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `Part` table. All the data in the column will be lost.
  - You are about to drop the `PartVersion` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[partImageId]` on the table `Part` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `partId` to the `Inventory` table without a default value. This is not possible if the table is not empty.
  - Added the required column `partId` to the `InventoryTransaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `description` to the `Part` table without a default value. This is not possible if the table is not empty.
  - Added the required column `trackingType` to the `Part` table without a default value. This is not possible if the table is not empty.
  - Added the required column `unit` to the `Part` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "BOMPart" DROP CONSTRAINT "BOMPart_parentVersionId_fkey";

-- DropForeignKey
ALTER TABLE "BOMPart" DROP CONSTRAINT "BOMPart_versionId_fkey";

-- DropForeignKey
ALTER TABLE "File" DROP CONSTRAINT "File_partVersionId_fkey";

-- DropForeignKey
ALTER TABLE "Inventory" DROP CONSTRAINT "Inventory_versionId_fkey";

-- DropForeignKey
ALTER TABLE "InventoryTransaction" DROP CONSTRAINT "InventoryTransaction_versionId_fkey";

-- DropForeignKey
ALTER TABLE "Part" DROP CONSTRAINT "Part_latestVersionId_fkey";

-- DropForeignKey
ALTER TABLE "PartVersion" DROP CONSTRAINT "PartVersion_createdById_fkey";

-- DropForeignKey
ALTER TABLE "PartVersion" DROP CONSTRAINT "PartVersion_partId_fkey";

-- DropForeignKey
ALTER TABLE "PartVersion" DROP CONSTRAINT "PartVersion_partImageId_fkey";

-- DropIndex
DROP INDEX "Part_latestVersionId_key";

-- AlterTable
ALTER TABLE "BOMPart" DROP COLUMN "parentVersionId",
DROP COLUMN "versionId",
ADD COLUMN     "parentPartId" TEXT,
ADD COLUMN     "partId" TEXT;

-- AlterTable
ALTER TABLE "File" DROP COLUMN "partVersionId",
ADD COLUMN     "partId" TEXT;

-- AlterTable
ALTER TABLE "Inventory" DROP COLUMN "versionId",
ADD COLUMN     "partId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "InventoryTransaction" DROP COLUMN "versionId",
ADD COLUMN     "partId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Part" DROP COLUMN "createdAt",
DROP COLUMN "deletedAt",
DROP COLUMN "latestVersionId",
DROP COLUMN "updatedAt",
ADD COLUMN     "category" "PartCategory",
ADD COLUMN     "description" TEXT NOT NULL,
ADD COLUMN     "partImageId" TEXT,
ADD COLUMN     "trackingType" "TrackingType" NOT NULL,
ADD COLUMN     "unit" TEXT NOT NULL;

-- DropTable
DROP TABLE "PartVersion";

-- DropEnum
DROP TYPE "VersionStatus";

-- CreateIndex
CREATE UNIQUE INDEX "Part_partImageId_key" ON "Part"("partImageId");

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_partId_fkey" FOREIGN KEY ("partId") REFERENCES "Part"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Part" ADD CONSTRAINT "Part_partImageId_fkey" FOREIGN KEY ("partImageId") REFERENCES "File"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BOMPart" ADD CONSTRAINT "BOMPart_parentPartId_fkey" FOREIGN KEY ("parentPartId") REFERENCES "Part"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BOMPart" ADD CONSTRAINT "BOMPart_partId_fkey" FOREIGN KEY ("partId") REFERENCES "Part"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inventory" ADD CONSTRAINT "Inventory_partId_fkey" FOREIGN KEY ("partId") REFERENCES "Part"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryTransaction" ADD CONSTRAINT "InventoryTransaction_partId_fkey" FOREIGN KEY ("partId") REFERENCES "Part"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
