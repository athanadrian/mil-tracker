/*
  Warnings:

  - You are about to drop the column `notes` on the `companies` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "personnel" ADD COLUMN "classYear" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_companies" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "website" TEXT,
    "companyImage" TEXT,
    "description" TEXT,
    "hqCountryId" TEXT,
    CONSTRAINT "companies_hqCountryId_fkey" FOREIGN KEY ("hqCountryId") REFERENCES "countries" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_companies" ("companyImage", "description", "hqCountryId", "id", "name", "website") SELECT "companyImage", "description", "hqCountryId", "id", "name", "website" FROM "companies";
DROP TABLE "companies";
ALTER TABLE "new_companies" RENAME TO "companies";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
