/*
  Warnings:

  - You are about to alter the column `salaryMin` on the `JobApplication` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.
  - You are about to alter the column `salaryMax` on the `JobApplication` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Integer`.

*/
-- AlterTable
ALTER TABLE "JobApplication" ALTER COLUMN "salaryMin" SET DATA TYPE INTEGER,
ALTER COLUMN "salaryMax" SET DATA TYPE INTEGER;
