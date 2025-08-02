-- CreateEnum
CREATE TYPE "WorkCenterType" AS ENUM ('MACHINING', 'ASSEMBLY', 'INSPECTION', 'PACKAGING', 'SHIPPING', 'RECEIVING', 'MAINTENANCE', 'OTHER');

-- CreateTable
CREATE TABLE "WorkCenter" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" "WorkCenterType" NOT NULL,
    "capacity" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "efficiency" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "setupTime" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "costPerHour" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkCenter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Operation" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "workCenterId" TEXT NOT NULL,
    "defaultDuration" INTEGER NOT NULL,
    "setupTime" INTEGER NOT NULL DEFAULT 0,
    "requiresSkill" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Operation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Procedure" (
    "id" TEXT NOT NULL,
    "operationId" TEXT NOT NULL,
    "stepNumber" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "instructions" TEXT NOT NULL,
    "estimatedTime" INTEGER NOT NULL,
    "requiredTools" TEXT[],
    "safetyNotes" TEXT,
    "qualityChecks" TEXT[],
    "imageUrls" TEXT[],
    "videoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Procedure_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Routing" (
    "id" TEXT NOT NULL,
    "partId" TEXT NOT NULL,
    "routingNumber" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "effectiveDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiryDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Routing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoutingStep" (
    "id" TEXT NOT NULL,
    "routingId" TEXT NOT NULL,
    "stepNumber" INTEGER NOT NULL,
    "operationId" TEXT NOT NULL,
    "workCenterId" TEXT NOT NULL,
    "setupTime" INTEGER NOT NULL DEFAULT 0,
    "runTime" INTEGER NOT NULL,
    "queueTime" INTEGER NOT NULL DEFAULT 0,
    "moveTime" INTEGER NOT NULL DEFAULT 0,
    "notes" TEXT,

    CONSTRAINT "RoutingStep_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WorkCenter_code_key" ON "WorkCenter"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Operation_code_key" ON "Operation"("code");

-- CreateIndex
CREATE INDEX "Operation_workCenterId_idx" ON "Operation"("workCenterId");

-- CreateIndex
CREATE INDEX "Procedure_operationId_idx" ON "Procedure"("operationId");

-- CreateIndex
CREATE UNIQUE INDEX "Procedure_operationId_stepNumber_key" ON "Procedure"("operationId", "stepNumber");

-- CreateIndex
CREATE INDEX "Routing_partId_idx" ON "Routing"("partId");

-- CreateIndex
CREATE UNIQUE INDEX "Routing_partId_routingNumber_version_key" ON "Routing"("partId", "routingNumber", "version");

-- CreateIndex
CREATE INDEX "RoutingStep_routingId_idx" ON "RoutingStep"("routingId");

-- CreateIndex
CREATE INDEX "RoutingStep_operationId_idx" ON "RoutingStep"("operationId");

-- CreateIndex
CREATE INDEX "RoutingStep_workCenterId_idx" ON "RoutingStep"("workCenterId");

-- CreateIndex
CREATE UNIQUE INDEX "RoutingStep_routingId_stepNumber_key" ON "RoutingStep"("routingId", "stepNumber");

-- AddForeignKey
ALTER TABLE "Operation" ADD CONSTRAINT "Operation_workCenterId_fkey" FOREIGN KEY ("workCenterId") REFERENCES "WorkCenter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Procedure" ADD CONSTRAINT "Procedure_operationId_fkey" FOREIGN KEY ("operationId") REFERENCES "Operation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Routing" ADD CONSTRAINT "Routing_partId_fkey" FOREIGN KEY ("partId") REFERENCES "Part"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoutingStep" ADD CONSTRAINT "RoutingStep_routingId_fkey" FOREIGN KEY ("routingId") REFERENCES "Routing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoutingStep" ADD CONSTRAINT "RoutingStep_operationId_fkey" FOREIGN KEY ("operationId") REFERENCES "Operation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoutingStep" ADD CONSTRAINT "RoutingStep_workCenterId_fkey" FOREIGN KEY ("workCenterId") REFERENCES "WorkCenter"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
