/*
  Warnings:

  - You are about to drop the column `regionId` on the `countries` table. All the data in the column will be lost.
  - You are about to drop the column `organizationId` on the `meetings` table. All the data in the column will be lost.
  - You are about to drop the column `organizationId` on the `personnel` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "country_regions" (
    "countryId" TEXT NOT NULL,
    "regionId" TEXT NOT NULL,

    PRIMARY KEY ("countryId", "regionId"),
    CONSTRAINT "country_regions_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "countries" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "country_regions_regionId_fkey" FOREIGN KEY ("regionId") REFERENCES "regions" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "meeting_organizations" (
    "meetingId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,

    PRIMARY KEY ("meetingId", "organizationId"),
    CONSTRAINT "meeting_organizations_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "meetings" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "meeting_organizations_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_countries" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "iso2" TEXT,
    "countryImage" TEXT,
    "flag" TEXT,
    "description" TEXT
);
INSERT INTO "new_countries" ("countryImage", "description", "flag", "id", "iso2", "name") SELECT "countryImage", "description", "flag", "id", "iso2", "name" FROM "countries";
DROP TABLE "countries";
ALTER TABLE "new_countries" RENAME TO "countries";
CREATE UNIQUE INDEX "countries_name_key" ON "countries"("name");
CREATE UNIQUE INDEX "countries_iso2_key" ON "countries"("iso2");
CREATE TABLE "new_meetings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT,
    "date" DATETIME NOT NULL,
    "location" TEXT,
    "countryId" TEXT,
    "summary" TEXT,
    "meetingImagePaths" JSONB,
    CONSTRAINT "meetings_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "countries" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_meetings" ("code", "countryId", "date", "id", "location", "meetingImagePaths", "summary") SELECT "code", "countryId", "date", "id", "location", "meetingImagePaths", "summary" FROM "meetings";
DROP TABLE "meetings";
ALTER TABLE "new_meetings" RENAME TO "meetings";
CREATE UNIQUE INDEX "meetings_code_key" ON "meetings"("code");
CREATE INDEX "meetings_countryId_idx" ON "meetings"("countryId");
CREATE TABLE "new_personnel" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "nickname" TEXT,
    "rankId" TEXT,
    "type" TEXT NOT NULL,
    "countryId" TEXT,
    "companyId" TEXT,
    "branchId" TEXT,
    "specialtyId" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "classYear" TEXT,
    "description" TEXT,
    "personImagePaths" JSONB,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "retiredAt" DATETIME,
    CONSTRAINT "personnel_rankId_fkey" FOREIGN KEY ("rankId") REFERENCES "ranks" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "personnel_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "countries" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "personnel_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "personnel_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "personnel_specialtyId_fkey" FOREIGN KEY ("specialtyId") REFERENCES "specialties" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_personnel" ("branchId", "classYear", "companyId", "countryId", "description", "email", "firstName", "id", "lastName", "nickname", "personImagePaths", "phone", "rankId", "retiredAt", "specialtyId", "status", "type") SELECT "branchId", "classYear", "companyId", "countryId", "description", "email", "firstName", "id", "lastName", "nickname", "personImagePaths", "phone", "rankId", "retiredAt", "specialtyId", "status", "type" FROM "personnel";
DROP TABLE "personnel";
ALTER TABLE "new_personnel" RENAME TO "personnel";
CREATE INDEX "personnel_lastName_firstName_idx" ON "personnel"("lastName", "firstName");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
