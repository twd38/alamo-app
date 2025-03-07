/*
  Warnings:

  - You are about to drop the column `parentPartId` on the `BOMPart` table. All the data in the column will be lost.
  - You are about to drop the column `partId` on the `BOMPart` table. All the data in the column will be lost.
  - You are about to drop the column `partId` on the `File` table. All the data in the column will be lost.
  - You are about to drop the column `partId` on the `Inventory` table. All the data in the column will be lost.
  - You are about to drop the column `partId` on the `InventoryTransaction` table. All the data in the column will be lost.
  - You are about to drop the column `category` on the `Part` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `Part` table. All the data in the column will be lost.
  - You are about to drop the column `partImageId` on the `Part` table. All the data in the column will be lost.
  - You are about to drop the column `trackingType` on the `Part` table. All the data in the column will be lost.
  - You are about to drop the column `unit` on the `Part` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[latestVersionId]` on the table `Part` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `versionId` to the `Inventory` table without a default value. This is not possible if the table is not empty.
  - Added the required column `versionId` to the `InventoryTransaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Part` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "VersionStatus" AS ENUM ('draft', 'in_review', 'approved', 'released', 'obsolete');

-- DropForeignKey
ALTER TABLE "BOMPart" DROP CONSTRAINT "BOMPart_parentPartId_fkey";

-- DropForeignKey
ALTER TABLE "BOMPart" DROP CONSTRAINT "BOMPart_partId_fkey";

-- DropForeignKey
ALTER TABLE "File" DROP CONSTRAINT "File_partId_fkey";

-- DropForeignKey
ALTER TABLE "Inventory" DROP CONSTRAINT "Inventory_partId_fkey";

-- DropForeignKey
ALTER TABLE "InventoryTransaction" DROP CONSTRAINT "InventoryTransaction_partId_fkey";

-- DropForeignKey
ALTER TABLE "Part" DROP CONSTRAINT "Part_partImageId_fkey";

-- DropIndex
DROP INDEX "Part_partImageId_key";

-- AlterTable
ALTER TABLE "BOMPart" DROP COLUMN "parentPartId",
DROP COLUMN "partId",
ADD COLUMN     "parentVersionId" TEXT,
ADD COLUMN     "versionId" TEXT;

-- AlterTable
ALTER TABLE "File" DROP COLUMN "partId",
ADD COLUMN     "versionId" TEXT;

-- AlterTable
ALTER TABLE "Inventory" DROP COLUMN "partId",
ADD COLUMN     "versionId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "InventoryTransaction" DROP COLUMN "partId",
ADD COLUMN     "versionId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Part" DROP COLUMN "category",
DROP COLUMN "description",
DROP COLUMN "partImageId",
DROP COLUMN "trackingType",
DROP COLUMN "unit",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "deletedAt" TIMESTAMP(3),
ADD COLUMN     "latestVersionId" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- CreateTable
CREATE TABLE "PartVersion" (
    "id" TEXT NOT NULL,
    "versionNumber" TEXT NOT NULL,
    "partId" TEXT NOT NULL,
    "category" "PartCategory",
    "description" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "trackingType" "TrackingType" NOT NULL,
    "partImageId" TEXT,
    "effectiveDate" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" TEXT NOT NULL,
    "approvedAt" TIMESTAMP(3),
    "approvedById" TEXT,
    "status" "VersionStatus" NOT NULL DEFAULT 'draft',

    CONSTRAINT "PartVersion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PartVersion_partImageId_key" ON "PartVersion"("partImageId");

-- CreateIndex
CREATE UNIQUE INDEX "PartVersion_partId_versionNumber_key" ON "PartVersion"("partId", "versionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Part_latestVersionId_key" ON "Part"("latestVersionId");

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "PartVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Part" ADD CONSTRAINT "Part_latestVersionId_fkey" FOREIGN KEY ("latestVersionId") REFERENCES "PartVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartVersion" ADD CONSTRAINT "PartVersion_partId_fkey" FOREIGN KEY ("partId") REFERENCES "Part"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartVersion" ADD CONSTRAINT "PartVersion_partImageId_fkey" FOREIGN KEY ("partImageId") REFERENCES "File"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartVersion" ADD CONSTRAINT "PartVersion_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BOMPart" ADD CONSTRAINT "BOMPart_parentVersionId_fkey" FOREIGN KEY ("parentVersionId") REFERENCES "PartVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BOMPart" ADD CONSTRAINT "BOMPart_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "PartVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inventory" ADD CONSTRAINT "Inventory_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "PartVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryTransaction" ADD CONSTRAINT "InventoryTransaction_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "PartVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
