-- This is an empty migration.
ALTER TABLE "Task"
    RENAME COLUMN "priority" TO "priorityOld";

ALTER TABLE "Task"
    RENAME COLUMN "priorityInt" TO "priority";