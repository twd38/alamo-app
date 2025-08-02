-- CreateTable
CREATE TABLE "PartRouting" (
    "id" TEXT NOT NULL,
    "partId" TEXT NOT NULL,
    "routingId" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PartRouting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PartRouting_partId_idx" ON "PartRouting"("partId");

-- CreateIndex
CREATE INDEX "PartRouting_routingId_idx" ON "PartRouting"("routingId");

-- CreateIndex
CREATE UNIQUE INDEX "PartRouting_partId_routingId_key" ON "PartRouting"("partId", "routingId");

-- AddForeignKey
ALTER TABLE "PartRouting" ADD CONSTRAINT "PartRouting_partId_fkey" FOREIGN KEY ("partId") REFERENCES "Part"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartRouting" ADD CONSTRAINT "PartRouting_routingId_fkey" FOREIGN KEY ("routingId") REFERENCES "Routing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
