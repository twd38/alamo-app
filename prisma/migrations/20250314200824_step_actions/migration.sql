/*
  Warnings:

  - You are about to drop the column `revision` on the `WorkInstruction` table. All the data in the column will be lost.
  - You are about to drop the column `quantity` on the `WorkInstructionStepAction` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[uploadedFileId]` on the table `WorkInstructionStepAction` will be added. If there are existing duplicate values, this will fail.
  - Changed the type of `actionType` on the `WorkInstructionStepAction` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "ActionType" AS ENUM ('VALUE_INPUT', 'UPLOAD_IMAGE', 'SIGNOFF', 'CHECKBOX');

-- AlterTable
ALTER TABLE "WorkInstruction" DROP COLUMN "revision";

-- AlterTable
ALTER TABLE "WorkInstructionStepAction" DROP COLUMN "quantity",
ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "completedBy" TEXT,
ADD COLUMN     "completedValue" DOUBLE PRECISION,
ADD COLUMN     "isRequired" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "signoffRoles" TEXT[],
ADD COLUMN     "targetValue" DOUBLE PRECISION,
ADD COLUMN     "tolerance" DOUBLE PRECISION,
ADD COLUMN     "unit" TEXT,
ADD COLUMN     "uploadedFileId" TEXT,
DROP COLUMN "actionType",
ADD COLUMN     "actionType" "ActionType" NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "WorkInstructionStepAction_uploadedFileId_key" ON "WorkInstructionStepAction"("uploadedFileId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkInstructionStepAction_stepId_actionType_description_key" ON "WorkInstructionStepAction"("stepId", "actionType", "description");

-- AddForeignKey
ALTER TABLE "WorkInstructionStepAction" ADD CONSTRAINT "WorkInstructionStepAction_uploadedFileId_fkey" FOREIGN KEY ("uploadedFileId") REFERENCES "File"("id") ON DELETE SET NULL ON UPDATE CASCADE;
