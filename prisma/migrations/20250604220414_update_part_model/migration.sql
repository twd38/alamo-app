/*
  Warnings:

  - You are about to drop the column `partTypeNumber` on the `Part` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[partNumber,partRevision]` on the table `Part` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Part_parentVersionId_key";

-- AlterTable
ALTER TABLE "Part" DROP COLUMN "partTypeNumber",
ADD COLUMN     "name" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "revisionParentId" TEXT,
ALTER COLUMN "description" SET DEFAULT '',
ALTER COLUMN "trackingType" SET DEFAULT 'SERIAL',
ALTER COLUMN "unit" SET DEFAULT 'EA';

-- CreateIndex
CREATE UNIQUE INDEX "Part_partNumber_partRevision_key" ON "Part"("partNumber", "partRevision");

-- AddForeignKey
ALTER TABLE "Part" ADD CONSTRAINT "Part_revisionParentId_fkey" FOREIGN KEY ("revisionParentId") REFERENCES "Part"("id") ON DELETE SET NULL ON UPDATE CASCADE;
