/*
  Warnings:

  - You are about to drop the column `instructionId` on the `File` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "File" DROP CONSTRAINT "File_instructionId_fkey";

-- AlterTable
ALTER TABLE "File" DROP COLUMN "instructionId",
ADD COLUMN     "stepFileId" TEXT;

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_stepFileId_fkey" FOREIGN KEY ("stepFileId") REFERENCES "WorkInstructionStep"("id") ON DELETE SET NULL ON UPDATE CASCADE;
