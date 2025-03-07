/*
  Warnings:

  - Added the required column `partId` to the `BOMPart` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "BOMPart" ADD COLUMN     "partId" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "BOMPart" ADD CONSTRAINT "BOMPart_partId_fkey" FOREIGN KEY ("partId") REFERENCES "Part"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
