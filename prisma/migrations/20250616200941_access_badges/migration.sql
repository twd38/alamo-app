-- CreateTable
CREATE TABLE "AccessBadge" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "expiredAt" TIMESTAMP(3),
    "userId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,

    CONSTRAINT "AccessBadge_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AccessBadge_userId_key" ON "AccessBadge"("userId");

-- CreateIndex
CREATE INDEX "AccessBadge_createdById_idx" ON "AccessBadge"("createdById");

-- AddForeignKey
ALTER TABLE "AccessBadge" ADD CONSTRAINT "AccessBadge_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AccessBadge" ADD CONSTRAINT "AccessBadge_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
