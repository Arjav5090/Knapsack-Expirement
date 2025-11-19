/*
  Warnings:

  - You are about to drop the column `resultFeedback` on the `Participant` table. All the data in the column will be lost.
  - You are about to drop the column `resultPassed` on the `Participant` table. All the data in the column will be lost.
  - You are about to drop the column `resultScore` on the `Participant` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Participant" DROP COLUMN "resultFeedback",
DROP COLUMN "resultPassed",
DROP COLUMN "resultScore";
