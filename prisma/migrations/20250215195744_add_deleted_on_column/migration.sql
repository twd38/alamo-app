-- AlterTable
ALTER TABLE "File" ADD COLUMN     "deletedOn" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "deletedOn" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "deletedOn" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "WorkStation" ADD COLUMN     "deletedOn" TIMESTAMP(3);
