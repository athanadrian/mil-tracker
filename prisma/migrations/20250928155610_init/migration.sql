/*
  Warnings:

  - You are about to drop the column `title` on the `documents` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `meeting_topics` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `positions` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `regions` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `specialties` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `tags` table. All the data in the column will be lost.
  - Added the required column `name` to the `documents` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `meeting_topics` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `positions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `regions` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `specialties` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `tags` table without a default value. This is not possible if the table is not empty.

*/
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
    "notes" TEXT
);
INSERT INTO "new_documents" ("addedAt", "documentAction", "documentCategory", "filePath", "fileType", "hash", "id", "notes", "size", "thumbnailPath") SELECT "addedAt", "documentAction", "documentCategory", "filePath", "fileType", "hash", "id", "notes", "size", "thumbnailPath" FROM "documents";
DROP TABLE "documents";
ALTER TABLE "new_documents" RENAME TO "documents";
CREATE TABLE "new_meeting_topics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "meetingId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "notes" TEXT,
    CONSTRAINT "meeting_topics_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "meetings" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_meeting_topics" ("id", "meetingId", "notes") SELECT "id", "meetingId", "notes" FROM "meeting_topics";
DROP TABLE "meeting_topics";
ALTER TABLE "new_meeting_topics" RENAME TO "meeting_topics";
CREATE INDEX "meeting_topics_meetingId_idx" ON "meeting_topics"("meetingId");
CREATE TABLE "new_positions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT
);
INSERT INTO "new_positions" ("code", "description", "id") SELECT "code", "description", "id" FROM "positions";
DROP TABLE "positions";
ALTER TABLE "new_positions" RENAME TO "positions";
CREATE UNIQUE INDEX "positions_name_key" ON "positions"("name");
CREATE UNIQUE INDEX "positions_code_key" ON "positions"("code");
CREATE TABLE "new_regions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT
);
INSERT INTO "new_regions" ("code", "description", "id") SELECT "code", "description", "id" FROM "regions";
DROP TABLE "regions";
ALTER TABLE "new_regions" RENAME TO "regions";
CREATE UNIQUE INDEX "regions_name_key" ON "regions"("name");
CREATE UNIQUE INDEX "regions_code_key" ON "regions"("code");
CREATE TABLE "new_specialties" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "branchId" TEXT,
    CONSTRAINT "specialties_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_specialties" ("branchId", "code", "description", "id") SELECT "branchId", "code", "description", "id" FROM "specialties";
DROP TABLE "specialties";
ALTER TABLE "new_specialties" RENAME TO "specialties";
CREATE UNIQUE INDEX "specialties_name_key" ON "specialties"("name");
CREATE UNIQUE INDEX "specialties_code_key" ON "specialties"("code");
CREATE INDEX "specialties_branchId_idx" ON "specialties"("branchId");
CREATE TABLE "new_tags" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL
);
INSERT INTO "new_tags" ("description", "id", "type") SELECT "description", "id", "type" FROM "tags";
DROP TABLE "tags";
ALTER TABLE "new_tags" RENAME TO "tags";
CREATE UNIQUE INDEX "tags_name_type_key" ON "tags"("name", "type");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
