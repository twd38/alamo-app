-- This is an empty migration.

ALTER TABLE "Task" ADD COLUMN "priorityInt" INTEGER NOT NULL DEFAULT 0;
