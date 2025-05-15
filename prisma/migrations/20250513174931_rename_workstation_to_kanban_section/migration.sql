/*
  Warnings:

  - You are about to drop the column `workStationId` on the `Job` table. All the data in the column will be lost.
  - You are about to drop the column `workStationId` on the `Task` table. All the data in the column will be lost.
  - You are about to drop the `WorkStation` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Job" DROP CONSTRAINT "Job_workStationId_fkey";

-- DropForeignKey
ALTER TABLE "Task" DROP CONSTRAINT "Task_workStationId_fkey";

-- AlterTable
ALTER TABLE "Job" DROP COLUMN "workStationId",
ADD COLUMN     "kanbanSectionId" TEXT;

-- AlterTable
ALTER TABLE "Task" DROP COLUMN "workStationId",
ADD COLUMN     "kanbanSectionId" TEXT;

-- DropTable
DROP TABLE "WorkStation";

-- CreateTable
CREATE TABLE "KanbanSection" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kanbanOrder" INTEGER NOT NULL,
    "deletedOn" TIMESTAMP(3),

    CONSTRAINT "KanbanSection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Parcel" (
    "id" TEXT NOT NULL,
    "parcelNumber" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "area" DOUBLE PRECISION NOT NULL,
    "zoningId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Parcel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Zoning" (
    "id" TEXT NOT NULL,
    "zoningType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Zoning_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Parcel_parcelNumber_key" ON "Parcel"("parcelNumber");

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_kanbanSectionId_fkey" FOREIGN KEY ("kanbanSectionId") REFERENCES "KanbanSection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_kanbanSectionId_fkey" FOREIGN KEY ("kanbanSectionId") REFERENCES "KanbanSection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Parcel" ADD CONSTRAINT "Parcel_zoningId_fkey" FOREIGN KEY ("zoningId") REFERENCES "Zoning"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
