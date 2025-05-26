/*
  Warnings:

  - The `color` column on the `TaskTag` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "Color" AS ENUM ('slate', 'gray', 'zinc', 'neutral', 'stone', 'red', 'orange', 'amber', 'yellow', 'lime', 'green', 'emerald', 'teal', 'cyan', 'sky', 'blue', 'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'rose');

-- AlterTable
ALTER TABLE "TaskTag" DROP COLUMN "color",
ADD COLUMN     "color" "Color" NOT NULL DEFAULT 'slate';
