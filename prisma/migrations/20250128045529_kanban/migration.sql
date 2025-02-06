-- CreateEnum
CREATE TYPE "Status" AS ENUM ('Paused', 'Todo', 'InProgress', 'Completed', 'Scrapped');

-- CreateTable
CREATE TABLE "JobFile" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,

    CONSTRAINT "JobFile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL,
    "jobNumber" TEXT NOT NULL,
    "partName" TEXT NOT NULL,
    "operation" TEXT NOT NULL,
    "status" "Status" NOT NULL,
    "timeEstimate" TEXT NOT NULL,
    "dueDate" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "workStationId" TEXT,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkStation" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "kanbanOrder" INTEGER NOT NULL,

    CONSTRAINT "WorkStation_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "JobFile" ADD CONSTRAINT "JobFile_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_workStationId_fkey" FOREIGN KEY ("workStationId") REFERENCES "WorkStation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
