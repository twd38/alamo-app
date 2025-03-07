/*
  Warnings:

  - You are about to drop the `BOM_Component` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "BOM_Component" DROP CONSTRAINT "BOM_Component_parentPartId_fkey";

-- DropTable
DROP TABLE "BOM_Component";

-- CreateTable
CREATE TABLE "BOMPart" (
    "id" TEXT NOT NULL,
    "parentPartId" TEXT NOT NULL,
    "qty" INTEGER NOT NULL,
    "bomType" "BOMType" NOT NULL,

    CONSTRAINT "BOMPart_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "BOMPart" ADD CONSTRAINT "BOMPart_parentPartId_fkey" FOREIGN KEY ("parentPartId") REFERENCES "Part"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
