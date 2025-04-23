-- CreateTable
CREATE TABLE "DevelopmentPlan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "minimumLotArea" DOUBLE PRECISION NOT NULL,
    "minimumLotWidth" DOUBLE PRECISION NOT NULL,
    "minimumLotDepth" DOUBLE PRECISION NOT NULL,
    "height" DOUBLE PRECISION NOT NULL,
    "grossUnits" DOUBLE PRECISION NOT NULL,
    "grossUnitsPerAcre" DOUBLE PRECISION NOT NULL,
    "floorAreaRatio" DOUBLE PRECISION NOT NULL,
    "buildingArea" DOUBLE PRECISION NOT NULL,
    "imperviousCoverage" DOUBLE PRECISION NOT NULL,
    "alleyRequired" BOOLEAN NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DevelopmentPlan_pkey" PRIMARY KEY ("id")
);
