-- This is an empty migration.
ALTER TABLE "Task" ADD COLUMN "priorityInt" INTEGER NOT NULL DEFAULT 0;

-- Update priorityInt based on priority enum values
UPDATE "Task"
SET "priorityInt" = CASE
    WHEN priority = 'CRITICAL' THEN 3
    WHEN priority = 'HIGH' THEN 2
    WHEN priority = 'MEDIUM' THEN 1
    WHEN priority = 'LOW' THEN 0
END;
