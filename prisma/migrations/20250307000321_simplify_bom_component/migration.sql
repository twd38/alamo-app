/*
  Warnings:

  - You are about to drop the column `componentPartId` on the `BOM_Component` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "BOM_Component" DROP CONSTRAINT "BOM_Component_componentPartId_fkey";

-- AlterTable
ALTER TABLE "BOM_Component" DROP COLUMN "componentPartId";
