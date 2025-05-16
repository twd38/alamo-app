-- CreateTable
CREATE TABLE "_BoardCollaborators" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_BoardCollaborators_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_BoardCollaborators_B_index" ON "_BoardCollaborators"("B");

-- AddForeignKey
ALTER TABLE "_BoardCollaborators" ADD CONSTRAINT "_BoardCollaborators_A_fkey" FOREIGN KEY ("A") REFERENCES "Board"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_BoardCollaborators" ADD CONSTRAINT "_BoardCollaborators_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
