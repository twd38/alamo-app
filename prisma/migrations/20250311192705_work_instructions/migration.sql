-- CreateEnum
CREATE TYPE "InstructionStatus" AS ENUM ('DRAFT', 'REVIEW', 'APPROVED', 'DEPRECATED');

-- AlterTable
ALTER TABLE "File" ADD COLUMN     "instructionId" TEXT,
ADD COLUMN     "stepId" TEXT;

-- CreateTable
CREATE TABLE "WorkInstruction" (
    "id" TEXT NOT NULL,
    "partId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "baseInstructionNumber" TEXT,
    "versionNumber" TEXT NOT NULL DEFAULT '1',
    "instructionNumber" TEXT NOT NULL,
    "revision" TEXT NOT NULL DEFAULT 'A',
    "status" "InstructionStatus" NOT NULL DEFAULT 'DRAFT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,
    "approvedAt" TIMESTAMP(3),
    "approvedById" TEXT,
    "parentVersionId" TEXT,

    CONSTRAINT "WorkInstruction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkInstructionStep" (
    "id" TEXT NOT NULL,
    "workInstructionId" TEXT NOT NULL,
    "stepNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "instructions" TEXT NOT NULL,
    "estimatedLabourTime" INTEGER NOT NULL,
    "requiredTools" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkInstructionStep_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WorkInstructionStepAction" (
    "id" TEXT NOT NULL,
    "stepId" TEXT NOT NULL,
    "actionType" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "quantity" INTEGER,
    "notes" TEXT,

    CONSTRAINT "WorkInstructionStepAction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WorkInstruction_baseInstructionNumber_key" ON "WorkInstruction"("baseInstructionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "WorkInstruction_instructionNumber_key" ON "WorkInstruction"("instructionNumber");

-- CreateIndex
CREATE UNIQUE INDEX "WorkInstruction_parentVersionId_key" ON "WorkInstruction"("parentVersionId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkInstructionStep_workInstructionId_stepNumber_key" ON "WorkInstructionStep"("workInstructionId", "stepNumber");

-- CreateIndex
CREATE UNIQUE INDEX "WorkInstructionStepAction_stepId_actionType_description_key" ON "WorkInstructionStepAction"("stepId", "actionType", "description");

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_instructionId_fkey" FOREIGN KEY ("instructionId") REFERENCES "WorkInstruction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "WorkInstructionStep"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkInstruction" ADD CONSTRAINT "WorkInstruction_partId_fkey" FOREIGN KEY ("partId") REFERENCES "Part"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkInstruction" ADD CONSTRAINT "WorkInstruction_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkInstruction" ADD CONSTRAINT "WorkInstruction_approvedById_fkey" FOREIGN KEY ("approvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkInstruction" ADD CONSTRAINT "WorkInstruction_parentVersionId_fkey" FOREIGN KEY ("parentVersionId") REFERENCES "WorkInstruction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkInstructionStep" ADD CONSTRAINT "WorkInstructionStep_workInstructionId_fkey" FOREIGN KEY ("workInstructionId") REFERENCES "WorkInstruction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WorkInstructionStepAction" ADD CONSTRAINT "WorkInstructionStepAction_stepId_fkey" FOREIGN KEY ("stepId") REFERENCES "WorkInstructionStep"("id") ON DELETE CASCADE ON UPDATE CASCADE;
