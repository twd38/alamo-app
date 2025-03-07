/*
  Warnings:

  - You are about to drop the column `categoryNumber` on the `Part` table. All the data in the column will be lost.
  - You are about to drop the column `partCategory` on the `Part` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "PartType" AS ENUM ('ASSEMBLY_400', 'MODULE_300', 'SUBASSEMBLY_200', 'PART_100', 'RAW_000', 'BIN', 'SHIP');

-- AlterTable
ALTER TABLE "Part" DROP COLUMN "categoryNumber",
DROP COLUMN "partCategory",
ADD COLUMN     "partType" "PartType" NOT NULL DEFAULT 'RAW_000',
ADD COLUMN     "partTypeNumber" TEXT NOT NULL DEFAULT '000';

-- DropEnum
DROP TYPE "PartCategory";
