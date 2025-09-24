/*
  Warnings:

  - You are about to drop the column `flagImage` on the `Country` table. All the data in the column will be lost.
  - You are about to drop the column `manufacturerId` on the `Equipment` table. All the data in the column will be lost.
  - You are about to drop the column `image` on the `Rank` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Document" ADD COLUMN "documentAction" TEXT;
ALTER TABLE "Document" ADD COLUMN "documentCategory" TEXT;

-- AlterTable
ALTER TABLE "Meeting" ADD COLUMN "meetingImagePaths" JSONB;

-- AlterTable
ALTER TABLE "Organization" ADD COLUMN "organizationImage" TEXT;

-- AlterTable
ALTER TABLE "Unit" ADD COLUMN "unitImage" TEXT;

-- CreateTable
CREATE TABLE "Company" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "website" TEXT,
    "notes" TEXT,
    "companyImage" TEXT,
    "hqCountryId" TEXT,
    CONSTRAINT "Company_hqCountryId_fkey" FOREIGN KEY ("hqCountryId") REFERENCES "Country" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CompanyOffice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "companyId" TEXT NOT NULL,
    "countryId" TEXT NOT NULL,
    "city" TEXT,
    "address" TEXT,
    "latitude" REAL,
    "longitude" REAL,
    CONSTRAINT "CompanyOffice_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CompanyOffice_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CompanyOrganization" (
    "companyId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "role" TEXT,
    "since" DATETIME,
    "until" DATETIME,

    PRIMARY KEY ("companyId", "organizationId"),
    CONSTRAINT "CompanyOrganization_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CompanyOrganization_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Country" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "iso2" TEXT,
    "countryImage" TEXT
);
INSERT INTO "new_Country" ("id", "iso2", "name") SELECT "id", "iso2", "name" FROM "Country";
DROP TABLE "Country";
ALTER TABLE "new_Country" RENAME TO "Country";
CREATE UNIQUE INDEX "Country_name_key" ON "Country"("name");
CREATE UNIQUE INDEX "Country_iso2_key" ON "Country"("iso2");
CREATE TABLE "new_Equipment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "model" TEXT,
    "category" TEXT NOT NULL,
    "manufacturerCompanyId" TEXT,
    "countryOfOriginId" TEXT,
    "equipmentImagePaths" JSONB,
    "specs" JSONB,
    CONSTRAINT "Equipment_manufacturerCompanyId_fkey" FOREIGN KEY ("manufacturerCompanyId") REFERENCES "Company" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Equipment_countryOfOriginId_fkey" FOREIGN KEY ("countryOfOriginId") REFERENCES "Country" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Equipment" ("category", "countryOfOriginId", "id", "model", "name", "specs") SELECT "category", "countryOfOriginId", "id", "model", "name", "specs" FROM "Equipment";
DROP TABLE "Equipment";
ALTER TABLE "new_Equipment" RENAME TO "Equipment";
CREATE TABLE "new_Person" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "rankId" TEXT,
    "countryId" TEXT,
    "organizationId" TEXT,
    "companyId" TEXT,
    "branchId" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "notes" TEXT,
    "personImagePaths" JSONB,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "retiredAt" DATETIME,
    CONSTRAINT "Person_rankId_fkey" FOREIGN KEY ("rankId") REFERENCES "Rank" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Person_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "Country" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Person_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Person_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Person_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "ServiceBranch" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Person" ("branchId", "countryId", "email", "firstName", "id", "lastName", "notes", "organizationId", "phone", "rankId", "retiredAt", "status") SELECT "branchId", "countryId", "email", "firstName", "id", "lastName", "notes", "organizationId", "phone", "rankId", "retiredAt", "status" FROM "Person";
DROP TABLE "Person";
ALTER TABLE "new_Person" RENAME TO "Person";
CREATE TABLE "new_Rank" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "tier" TEXT NOT NULL,
    "level" INTEGER,
    "rankImage" TEXT
);
INSERT INTO "new_Rank" ("code", "id", "level", "name", "tier") SELECT "code", "id", "level", "name", "tier" FROM "Rank";
DROP TABLE "Rank";
ALTER TABLE "new_Rank" RENAME TO "Rank";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "CompanyOffice_companyId_idx" ON "CompanyOffice"("companyId");

-- CreateIndex
CREATE INDEX "CompanyOffice_countryId_idx" ON "CompanyOffice"("countryId");
