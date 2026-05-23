/*
  Warnings:

  - A unique constraint covering the columns `[displayDate]` on the table `Quote` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `displayDate` to the `Quote` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Quote" ADD COLUMN     "displayDate" DATE NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Quote_displayDate_key" ON "Quote"("displayDate");
