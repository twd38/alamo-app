-- AlterTable
ALTER TABLE "Part" ADD COLUMN     "nxFilePath" TEXT,
ADD COLUMN     "partRevision" TEXT NOT NULL DEFAULT 'A';
