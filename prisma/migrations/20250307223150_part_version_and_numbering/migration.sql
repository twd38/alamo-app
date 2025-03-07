/*
  Warnings:

  - You are about to drop the column `category` on the `Part` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[basePartNumber]` on the table `Part` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[parentVersionId]` on the table `Part` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Part" DROP COLUMN "category",
ADD COLUMN     "basePartNumber" TEXT,
ADD COLUMN     "categoryNumber" TEXT NOT NULL DEFAULT '000',
ADD COLUMN     "parentVersionId" TEXT,
ADD COLUMN     "versionNumber" TEXT NOT NULL DEFAULT '1';

-- CreateIndex
CREATE UNIQUE INDEX "Part_basePartNumber_key" ON "Part"("basePartNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Part_parentVersionId_key" ON "Part"("parentVersionId");

-- AddForeignKey
ALTER TABLE "Part" ADD CONSTRAINT "Part_parentVersionId_fkey" FOREIGN KEY ("parentVersionId") REFERENCES "Part"("id") ON DELETE SET NULL ON UPDATE CASCADE;
