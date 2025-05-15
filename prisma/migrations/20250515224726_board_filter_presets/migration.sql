-- CreateTable
CREATE TABLE "BoardFilterPreset" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "filters" JSONB NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BoardFilterPreset_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "BoardFilterPreset" ADD CONSTRAINT "BoardFilterPreset_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
