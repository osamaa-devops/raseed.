/*
  Warnings:

  - Made the column `maxBranches` on table `SubscriptionPlan` required. This step will fail if there are existing NULL values in that column.
  - Made the column `maxUsers` on table `SubscriptionPlan` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "SubscriptionPlan" ALTER COLUMN "maxBranches" SET NOT NULL,
ALTER COLUMN "maxUsers" SET NOT NULL,
ALTER COLUMN "maxProducts" DROP DEFAULT;
