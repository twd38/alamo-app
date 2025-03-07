/*
  Warnings:

  - A unique constraint covering the columns `[partImageId]` on the table `Part` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "File" ADD COLUMN     "partId" TEXT;

-- AlterTable
ALTER TABLE "Part" ADD COLUMN     "partImageId" TEXT,
ALTER COLUMN "category" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Part_partImageId_key" ON "Part"("partImageId");

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_partId_fkey" FOREIGN KEY ("partId") REFERENCES "Part"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Part" ADD CONSTRAINT "Part_partImageId_fkey" FOREIGN KEY ("partImageId") REFERENCES "File"("id") ON DELETE SET NULL ON UPDATE CASCADE;
