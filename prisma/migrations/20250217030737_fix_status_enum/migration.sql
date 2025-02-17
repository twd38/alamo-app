/*
  Warnings:

  - The values [Paused,Todo,InProgress,Completed,Scrapped] on the enum `Status` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Status_new" AS ENUM ('paused', 'todo', 'in_progress', 'completed', 'scrapped');
ALTER TABLE "Job" ALTER COLUMN "status" TYPE "Status_new" USING ("status"::text::"Status_new");
ALTER TABLE "Task" ALTER COLUMN "status" TYPE "Status_new" USING ("status"::text::"Status_new");
ALTER TYPE "Status" RENAME TO "Status_old";
ALTER TYPE "Status_new" RENAME TO "Status";
DROP TYPE "Status_old";
COMMIT;
