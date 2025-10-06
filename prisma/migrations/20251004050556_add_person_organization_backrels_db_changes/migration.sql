/*
  Warnings:

  - You are about to drop the `people` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `notes` on the `documents` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `equipment_assignments` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `installations` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `meeting_participants` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `meeting_topics` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "people_lastName_firstName_idx";

-- DropIndex
DROP INDEX "positions_name_key";

-- AlterTable
ALTER TABLE "branches" ADD COLUMN "description" TEXT;

-- AlterTable
ALTER TABLE "companies" ADD COLUMN "description" TEXT;

-- AlterTable
ALTER TABLE "company_offices" ADD COLUMN "description" TEXT;

-- AlterTable
ALTER TABLE "company_organizations" ADD COLUMN "description" TEXT;

-- AlterTable
ALTER TABLE "countries" ADD COLUMN "description" TEXT;

-- AlterTable
ALTER TABLE "equipments" ADD COLUMN "description" TEXT;

-- AlterTable
ALTER TABLE "ranks" ADD COLUMN "description" TEXT;

-- AlterTable
ALTER TABLE "units" ADD COLUMN "description" TEXT;

-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "people";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "person_organizations" (
    "personId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "role" TEXT,
    "since" DATETIME,
    "until" DATETIME,

    PRIMARY KEY ("personId", "organizationId"),
    CONSTRAINT "person_organizations_personId_fkey" FOREIGN KEY ("personId") REFERENCES "personnel" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "person_organizations_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "personnel" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "nickname" TEXT,
    "rankId" TEXT,
    "type" TEXT NOT NULL,
    "countryId" TEXT,
    "organizationId" TEXT,
    "companyId" TEXT,
    "branchId" TEXT,
    "specialtyId" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "description" TEXT,
    "personImagePaths" JSONB,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "retiredAt" DATETIME,
    CONSTRAINT "personnel_rankId_fkey" FOREIGN KEY ("rankId") REFERENCES "ranks" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "personnel_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "countries" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "personnel_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "personnel_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "personnel_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "personnel_specialtyId_fkey" FOREIGN KEY ("specialtyId") REFERENCES "specialties" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_documents" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileType" TEXT,
    "documentCategory" TEXT,
    "documentAction" TEXT,
    "size" INTEGER,
    "hash" TEXT,
    "addedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "thumbnailPath" TEXT,
    "description" TEXT
);
INSERT INTO "new_documents" ("addedAt", "documentAction", "documentCategory", "filePath", "fileType", "hash", "id", "name", "size", "thumbnailPath") SELECT "addedAt", "documentAction", "documentCategory", "filePath", "fileType", "hash", "id", "name", "size", "thumbnailPath" FROM "documents";
DROP TABLE "documents";
ALTER TABLE "new_documents" RENAME TO "documents";
CREATE TABLE "new_equipment_assignments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "unitId" TEXT NOT NULL,
    "equipmentId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "description" TEXT,
    CONSTRAINT "equipment_assignments_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "equipment_assignments_equipmentId_fkey" FOREIGN KEY ("equipmentId") REFERENCES "equipments" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_equipment_assignments" ("equipmentId", "id", "quantity", "status", "unitId") SELECT "equipmentId", "id", "quantity", "status", "unitId" FROM "equipment_assignments";
DROP TABLE "equipment_assignments";
ALTER TABLE "new_equipment_assignments" RENAME TO "equipment_assignments";
CREATE INDEX "equipment_assignments_unitId_idx" ON "equipment_assignments"("unitId");
CREATE INDEX "equipment_assignments_equipmentId_idx" ON "equipment_assignments"("equipmentId");
CREATE TABLE "new_installations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "personId" TEXT NOT NULL,
    "unitId" TEXT,
    "organizationId" TEXT,
    "countryId" TEXT,
    "type" TEXT NOT NULL DEFAULT 'TRANSFER',
    "positionId" TEXT,
    "role" TEXT,
    "rankAtTimeId" TEXT,
    "orderNumber" TEXT,
    "orderDate" DATETIME,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME,
    "installationYear" INTEGER,
    "description" TEXT,
    CONSTRAINT "installations_personId_fkey" FOREIGN KEY ("personId") REFERENCES "personnel" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "installations_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "units" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "installations_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "installations_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "countries" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "installations_positionId_fkey" FOREIGN KEY ("positionId") REFERENCES "positions" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "installations_rankAtTimeId_fkey" FOREIGN KEY ("rankAtTimeId") REFERENCES "ranks" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_installations" ("countryId", "endDate", "id", "installationYear", "orderDate", "orderNumber", "organizationId", "personId", "positionId", "rankAtTimeId", "role", "startDate", "type", "unitId") SELECT "countryId", "endDate", "id", "installationYear", "orderDate", "orderNumber", "organizationId", "personId", "positionId", "rankAtTimeId", "role", "startDate", "type", "unitId" FROM "installations";
DROP TABLE "installations";
ALTER TABLE "new_installations" RENAME TO "installations";
CREATE INDEX "installations_personId_startDate_idx" ON "installations"("personId", "startDate");
CREATE INDEX "installations_unitId_idx" ON "installations"("unitId");
CREATE INDEX "installations_organizationId_idx" ON "installations"("organizationId");
CREATE INDEX "installations_countryId_idx" ON "installations"("countryId");
CREATE INDEX "installations_positionId_idx" ON "installations"("positionId");
CREATE TABLE "new_meeting_participants" (
    "meetingId" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "role" TEXT,
    "description" TEXT,

    PRIMARY KEY ("meetingId", "personId"),
    CONSTRAINT "meeting_participants_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "meetings" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "meeting_participants_personId_fkey" FOREIGN KEY ("personId") REFERENCES "personnel" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_meeting_participants" ("meetingId", "personId", "role") SELECT "meetingId", "personId", "role" FROM "meeting_participants";
DROP TABLE "meeting_participants";
ALTER TABLE "new_meeting_participants" RENAME TO "meeting_participants";
CREATE TABLE "new_meeting_topics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "meetingId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    CONSTRAINT "meeting_topics_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "meetings" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_meeting_topics" ("id", "meetingId", "name") SELECT "id", "meetingId", "name" FROM "meeting_topics";
DROP TABLE "meeting_topics";
ALTER TABLE "new_meeting_topics" RENAME TO "meeting_topics";
CREATE INDEX "meeting_topics_meetingId_idx" ON "meeting_topics"("meetingId");
CREATE TABLE "new_organizations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "type" TEXT NOT NULL,
    "organizationImage" TEXT,
    "description" TEXT,
    "countryId" TEXT,
    "parentId" TEXT,
    CONSTRAINT "organizations_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "countries" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "organizations_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "organizations" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_organizations" ("code", "countryId", "id", "name", "organizationImage", "type") SELECT "code", "countryId", "id", "name", "organizationImage", "type" FROM "organizations";
DROP TABLE "organizations";
ALTER TABLE "new_organizations" RENAME TO "organizations";
CREATE UNIQUE INDEX "organizations_code_key" ON "organizations"("code");
CREATE TABLE "new_promotions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "personId" TEXT NOT NULL,
    "rankId" TEXT NOT NULL,
    "promotionYear" INTEGER NOT NULL,
    "description" TEXT,
    CONSTRAINT "promotions_personId_fkey" FOREIGN KEY ("personId") REFERENCES "personnel" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "promotions_rankId_fkey" FOREIGN KEY ("rankId") REFERENCES "ranks" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_promotions" ("id", "personId", "promotionYear", "rankId") SELECT "id", "personId", "promotionYear", "rankId" FROM "promotions";
DROP TABLE "promotions";
ALTER TABLE "new_promotions" RENAME TO "promotions";
CREATE INDEX "promotions_personId_promotionYear_idx" ON "promotions"("personId", "promotionYear");
CREATE UNIQUE INDEX "promotions_personId_rankId_promotionYear_key" ON "promotions"("personId", "rankId", "promotionYear");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "personnel_lastName_firstName_idx" ON "personnel"("lastName", "firstName");
