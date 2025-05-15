/*
  Warnings:

  - You are about to drop the `BoardFilterPreset` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "BoardFilterPreset" DROP CONSTRAINT "BoardFilterPreset_createdById_fkey";

-- DropTable
DROP TABLE "BoardFilterPreset";

-- CreateTable
CREATE TABLE "BoardView" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "filters" JSONB NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BoardView_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "BoardView" ADD CONSTRAINT "BoardView_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
