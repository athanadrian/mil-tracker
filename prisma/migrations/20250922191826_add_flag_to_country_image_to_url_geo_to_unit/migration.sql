-- AlterTable
ALTER TABLE "Country" ADD COLUMN "flagImage" TEXT;

-- AlterTable
ALTER TABLE "Rank" ADD COLUMN "image" TEXT;

-- AlterTable
ALTER TABLE "Unit" ADD COLUMN "latitude" REAL;
ALTER TABLE "Unit" ADD COLUMN "longitude" REAL;

-- CreateIndex
CREATE INDEX "Unit_latitude_longitude_idx" ON "Unit"("latitude", "longitude");
