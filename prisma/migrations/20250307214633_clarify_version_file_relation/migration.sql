/*
  Warnings:

  - You are about to drop the column `versionId` on the `File` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "File" DROP CONSTRAINT "File_versionId_fkey";

-- AlterTable
ALTER TABLE "File" DROP COLUMN "versionId",
ADD COLUMN     "partVersionId" TEXT;

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_partVersionId_fkey" FOREIGN KEY ("partVersionId") REFERENCES "PartVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
