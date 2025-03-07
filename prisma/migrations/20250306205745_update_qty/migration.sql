/*
  Warnings:

  - You are about to drop the column `quantityPer` on the `BOM_Component` table. All the data in the column will be lost.
  - You are about to drop the column `quantity` on the `Inventory` table. All the data in the column will be lost.
  - You are about to drop the column `quantity` on the `InventoryTransaction` table. All the data in the column will be lost.
  - Added the required column `qty` to the `BOM_Component` table without a default value. This is not possible if the table is not empty.
  - Added the required column `qty` to the `Inventory` table without a default value. This is not possible if the table is not empty.
  - Added the required column `qty` to the `InventoryTransaction` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "BOM_Component" DROP COLUMN "quantityPer",
ADD COLUMN     "qty" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "Inventory" DROP COLUMN "quantity",
ADD COLUMN     "qty" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "InventoryTransaction" DROP COLUMN "quantity",
ADD COLUMN     "qty" INTEGER NOT NULL;
