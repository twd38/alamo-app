-- CreateTable
CREATE TABLE "WorkOrderTag" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" "Color" NOT NULL DEFAULT 'slate',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkOrderTag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_WorkOrderToWorkOrderTag" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_WorkOrderToWorkOrderTag_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE UNIQUE INDEX "WorkOrderTag_name_key" ON "WorkOrderTag"("name");

-- CreateIndex
CREATE INDEX "_WorkOrderToWorkOrderTag_B_index" ON "_WorkOrderToWorkOrderTag"("B");

-- AddForeignKey
ALTER TABLE "_WorkOrderToWorkOrderTag" ADD CONSTRAINT "_WorkOrderToWorkOrderTag_A_fkey" FOREIGN KEY ("A") REFERENCES "WorkOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_WorkOrderToWorkOrderTag" ADD CONSTRAINT "_WorkOrderToWorkOrderTag_B_fkey" FOREIGN KEY ("B") REFERENCES "WorkOrderTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
