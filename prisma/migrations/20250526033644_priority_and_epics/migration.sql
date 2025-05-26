/*
  Warnings:

  - Made the column `priority` on table `Task` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterEnum
ALTER TYPE "Priority" ADD VALUE 'CRITICAL';

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "epicId" TEXT,
ALTER COLUMN "priority" SET NOT NULL;

-- CreateTable
CREATE TABLE "Epic" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT DEFAULT 'bg-gray-500',
    "boardId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Epic_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Epic_name_boardId_key" ON "Epic"("name", "boardId");

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_epicId_fkey" FOREIGN KEY ("epicId") REFERENCES "Epic"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Epic" ADD CONSTRAINT "Epic_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "Board"("id") ON DELETE SET NULL ON UPDATE CASCADE;
