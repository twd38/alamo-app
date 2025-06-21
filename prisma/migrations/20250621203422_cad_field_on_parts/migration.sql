/*
  Warnings:

  - A unique constraint covering the columns `[cadFileId]` on the table `Part` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[gltfFileId]` on the table `Part` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Part" ADD COLUMN     "cadFileId" TEXT,
ADD COLUMN     "gltfFileId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Part_cadFileId_key" ON "Part"("cadFileId");

-- CreateIndex
CREATE UNIQUE INDEX "Part_gltfFileId_key" ON "Part"("gltfFileId");

-- AddForeignKey
ALTER TABLE "Part" ADD CONSTRAINT "Part_cadFileId_fkey" FOREIGN KEY ("cadFileId") REFERENCES "File"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Part" ADD CONSTRAINT "Part_gltfFileId_fkey" FOREIGN KEY ("gltfFileId") REFERENCES "File"("id") ON DELETE SET NULL ON UPDATE CASCADE;
