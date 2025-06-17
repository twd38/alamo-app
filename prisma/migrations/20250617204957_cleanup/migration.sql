/*
  Warnings:

  - You are about to drop the column `completedAt` on the `WorkInstructionStepAction` table. All the data in the column will be lost.
  - You are about to drop the column `completedBy` on the `WorkInstructionStepAction` table. All the data in the column will be lost.
  - You are about to drop the column `completedValue` on the `WorkInstructionStepAction` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "WorkInstructionStepAction" DROP COLUMN "completedAt",
DROP COLUMN "completedBy",
DROP COLUMN "completedValue";
