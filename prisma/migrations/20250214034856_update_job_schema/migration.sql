-- CreateTable
CREATE TABLE "JobAssignee" (
    "jobId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "JobAssignee_pkey" PRIMARY KEY ("jobId","userId")
);

-- AddForeignKey
ALTER TABLE "JobAssignee" ADD CONSTRAINT "JobAssignee_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobAssignee" ADD CONSTRAINT "JobAssignee_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
