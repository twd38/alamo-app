-- AlterTable
ALTER TABLE "File" ADD COLUMN     "commentId" TEXT;

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_commentId_fkey" FOREIGN KEY ("commentId") REFERENCES "Comment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
