/*
  Warnings:

  - You are about to drop the column `moodTag` on the `MoodRecord` table. All the data in the column will be lost.
  - You are about to drop the column `note` on the `MoodRecord` table. All the data in the column will be lost.
  - Added the required column `content` to the `MoodRecord` table without a default value. This is not possible if the table is not empty.
  - Added the required column `mood` to the `MoodRecord` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `MoodRecord` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."MoodRecord" DROP CONSTRAINT "MoodRecord_userId_fkey";

-- AlterTable
ALTER TABLE "MoodRecord" DROP COLUMN "moodTag",
DROP COLUMN "note",
ADD COLUMN     "content" TEXT NOT NULL,
ADD COLUMN     "isPrivate" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "mood" TEXT NOT NULL,
ADD COLUMN     "moodScore" INTEGER NOT NULL DEFAULT 5,
ADD COLUMN     "tags" TEXT[],
ADD COLUMN     "title" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "weather" TEXT;

-- CreateIndex
CREATE INDEX "MoodRecord_userId_createdAt_idx" ON "MoodRecord"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "MoodRecord_userId_mood_idx" ON "MoodRecord"("userId", "mood");

-- AddForeignKey
ALTER TABLE "MoodRecord" ADD CONSTRAINT "MoodRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
