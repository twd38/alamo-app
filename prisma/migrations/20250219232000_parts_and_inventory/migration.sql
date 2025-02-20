-- CreateEnum
CREATE TYPE "PartCategory" AS ENUM ('ASSEMBLY_400', 'MODULE_300', 'SUBASSEMBLY_200', 'PART_100', 'RAW_000', 'BIN', 'SHIP');

-- CreateEnum
CREATE TYPE "TrackingType" AS ENUM ('SERIAL', 'BATCH', 'LOT');

-- CreateEnum
CREATE TYPE "BOMType" AS ENUM ('ENGINEERING', 'MANUFACTURING');

-- CreateEnum
CREATE TYPE "LocationType" AS ENUM ('WAREHOUSE', 'AISLE', 'SHELF', 'BIN', 'CONTAINER', 'SHIPPING', 'WIP');

-- CreateEnum
CREATE TYPE "TransactionType" AS ENUM ('PURCHASE_RECEIPT', 'PRODUCTION_ISSUE', 'PRODUCTION_RETURN', 'MOVE', 'ADJUSTMENT', 'SHIPMENT');

-- CreateTable
CREATE TABLE "Part" (
    "id" TEXT NOT NULL,
    "partNumber" TEXT NOT NULL,
    "category" "PartCategory" NOT NULL,
    "description" TEXT NOT NULL,
    "unit" TEXT NOT NULL,
    "trackingType" "TrackingType" NOT NULL,

    CONSTRAINT "Part_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartNumberSequence" (
    "id" TEXT NOT NULL,
    "category" "PartCategory" NOT NULL,
    "description" TEXT NOT NULL,
    "nextSeq" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "PartNumberSequence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BOM_Component" (
    "id" TEXT NOT NULL,
    "parentPartId" TEXT NOT NULL,
    "componentPartId" TEXT NOT NULL,
    "quantityPer" INTEGER NOT NULL,
    "bomType" "BOMType" NOT NULL,

    CONSTRAINT "BOM_Component_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Inventory" (
    "id" TEXT NOT NULL,
    "partId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "serialNumber" TEXT,

    CONSTRAINT "Inventory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InventoryTransaction" (
    "id" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "partId" TEXT NOT NULL,
    "fromLocationId" TEXT,
    "toLocationId" TEXT,
    "quantity" INTEGER NOT NULL,
    "transactionType" "TransactionType" NOT NULL,
    "referenceId" TEXT,

    CONSTRAINT "InventoryTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Location" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "LocationType" NOT NULL,
    "parentLocationId" TEXT,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Part_partNumber_key" ON "Part"("partNumber");

-- CreateIndex
CREATE UNIQUE INDEX "PartNumberSequence_category_key" ON "PartNumberSequence"("category");

-- CreateIndex
CREATE UNIQUE INDEX "Inventory_serialNumber_key" ON "Inventory"("serialNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Location_parentLocationId_key" ON "Location"("parentLocationId");

-- AddForeignKey
ALTER TABLE "BOM_Component" ADD CONSTRAINT "BOM_Component_parentPartId_fkey" FOREIGN KEY ("parentPartId") REFERENCES "Part"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BOM_Component" ADD CONSTRAINT "BOM_Component_componentPartId_fkey" FOREIGN KEY ("componentPartId") REFERENCES "Part"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inventory" ADD CONSTRAINT "Inventory_partId_fkey" FOREIGN KEY ("partId") REFERENCES "Part"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inventory" ADD CONSTRAINT "Inventory_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "Location"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryTransaction" ADD CONSTRAINT "InventoryTransaction_partId_fkey" FOREIGN KEY ("partId") REFERENCES "Part"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryTransaction" ADD CONSTRAINT "InventoryTransaction_fromLocationId_fkey" FOREIGN KEY ("fromLocationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InventoryTransaction" ADD CONSTRAINT "InventoryTransaction_toLocationId_fkey" FOREIGN KEY ("toLocationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Location" ADD CONSTRAINT "Location_parentLocationId_fkey" FOREIGN KEY ("parentLocationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;
