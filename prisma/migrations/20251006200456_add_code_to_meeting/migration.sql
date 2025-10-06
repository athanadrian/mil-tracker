/*
  Warnings:

  - A unique constraint covering the columns `[code]` on the table `meetings` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "meetings" ADD COLUMN "code" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "meetings_code_key" ON "meetings"("code");
