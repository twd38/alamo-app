/*
  Warnings:

  - A unique constraint covering the columns `[apsUrn]` on the table `Part` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Part" ADD COLUMN     "apsUrn" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Part_apsUrn_key" ON "Part"("apsUrn");
