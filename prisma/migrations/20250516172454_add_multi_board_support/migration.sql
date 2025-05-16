/*
  Warnings:

  - You are about to drop the column `kanbanSectionId` on the `Job` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[name,boardId]` on the table `KanbanSection` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name,boardId]` on the table `TaskTag` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `boardId` to the `BoardView` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Job" DROP CONSTRAINT "Job_kanbanSectionId_fkey";

-- AlterTable
ALTER TABLE "BoardView" ADD COLUMN     "boardId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Job" DROP COLUMN "kanbanSectionId";

-- AlterTable
ALTER TABLE "KanbanSection" ADD COLUMN     "boardId" TEXT;

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "boardId" TEXT;

-- AlterTable
ALTER TABLE "TaskTag" ADD COLUMN     "boardId" TEXT;

-- CreateTable
CREATE TABLE "Board" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "private" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Board_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "KanbanSection_name_boardId_key" ON "KanbanSection"("name", "boardId");

-- CreateIndex
CREATE UNIQUE INDEX "TaskTag_name_boardId_key" ON "TaskTag"("name", "boardId");

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "Board"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TaskTag" ADD CONSTRAINT "TaskTag_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "Board"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "KanbanSection" ADD CONSTRAINT "KanbanSection_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "Board"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Board" ADD CONSTRAINT "Board_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BoardView" ADD CONSTRAINT "BoardView_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "Board"("id") ON DELETE CASCADE ON UPDATE CASCADE;
