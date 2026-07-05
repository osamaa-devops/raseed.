-- CreateEnum
CREATE TYPE "SubscriptionPlanStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- AlterEnum
ALTER TYPE "SubscriptionStatus" ADD VALUE IF NOT EXISTS 'SUSPENDED';

-- CreateEnum
CREATE TYPE "BillingCycle" AS ENUM ('MONTHLY', 'YEARLY', 'TRIAL');

-- CreateEnum
CREATE TYPE "SubscriptionPaymentMethod" AS ENUM ('CASH', 'BANK_TRANSFER', 'WALLET', 'CARD', 'MANUAL');

-- CreateEnum
CREATE TYPE "SubscriptionPaymentStatus" AS ENUM ('PAID', 'PENDING', 'FAILED', 'REFUNDED');

-- AlterTable
ALTER TABLE "SubscriptionPlan" RENAME COLUMN "monthlyPrice" TO "priceMonthly";
ALTER TABLE "SubscriptionPlan" RENAME COLUMN "isActive" TO "_legacyIsActive";

-- AlterTable
ALTER TABLE "SubscriptionPlan"
ADD COLUMN     "description" TEXT,
ADD COLUMN     "features" JSONB,
ADD COLUMN     "maxInvoicesPerMonth" INTEGER,
ADD COLUMN     "maxProducts" INTEGER NOT NULL DEFAULT 500,
ADD COLUMN     "priceYearly" DECIMAL(10,2),
ADD COLUMN     "status" "SubscriptionPlanStatus" NOT NULL DEFAULT 'ACTIVE';

UPDATE "SubscriptionPlan"
SET
  "status" = CASE WHEN "_legacyIsActive" THEN 'ACTIVE'::"SubscriptionPlanStatus" ELSE 'INACTIVE'::"SubscriptionPlanStatus" END,
  "maxUsers" = COALESCE("maxUsers", 1),
  "maxBranches" = COALESCE("maxBranches", 1),
  "maxProducts" = CASE
    WHEN code = 'starter' THEN 500
    WHEN code = 'pro' THEN 3000
    ELSE 1000
  END,
  "maxInvoicesPerMonth" = CASE
    WHEN code = 'starter' THEN 1000
    WHEN code = 'pro' THEN 5000
    ELSE 2000
  END,
  "priceYearly" = CASE
    WHEN "priceMonthly" = 0 THEN 0
    ELSE "priceMonthly" * 12
  END;

ALTER TABLE "SubscriptionPlan" DROP COLUMN "_legacyIsActive";

-- AlterTable
ALTER TABLE "Subscription" RENAME COLUMN "startsAt" TO "startDate";
ALTER TABLE "Subscription" RENAME COLUMN "endsAt" TO "endDate";

-- AlterTable
ALTER TABLE "Subscription"
ADD COLUMN     "amount" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "billingCycle" "BillingCycle" NOT NULL DEFAULT 'TRIAL',
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "trialEndsAt" TIMESTAMP(3);

UPDATE "Subscription"
SET
  "billingCycle" = CASE WHEN "status" = 'TRIAL' THEN 'TRIAL'::"BillingCycle" ELSE 'MONTHLY'::"BillingCycle" END,
  "trialEndsAt" = CASE WHEN "status" = 'TRIAL' THEN COALESCE("endDate", "startDate" + interval '14 days') ELSE NULL END,
  "amount" = 0;

-- CreateTable
CREATE TABLE "SubscriptionPayment" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "method" "SubscriptionPaymentMethod" NOT NULL,
    "status" "SubscriptionPaymentStatus" NOT NULL,
    "paidAt" TIMESTAMP(3),
    "reference" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SubscriptionPayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SubscriptionPlan_status_idx" ON "SubscriptionPlan"("status");

-- CreateIndex
CREATE INDEX "SubscriptionPayment_storeId_idx" ON "SubscriptionPayment"("storeId");

-- CreateIndex
CREATE INDEX "SubscriptionPayment_subscriptionId_idx" ON "SubscriptionPayment"("subscriptionId");

-- CreateIndex
CREATE INDEX "SubscriptionPayment_status_idx" ON "SubscriptionPayment"("status");

-- CreateIndex
CREATE INDEX "SubscriptionPayment_createdAt_idx" ON "SubscriptionPayment"("createdAt");

-- AddForeignKey
ALTER TABLE "SubscriptionPayment" ADD CONSTRAINT "SubscriptionPayment_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubscriptionPayment" ADD CONSTRAINT "SubscriptionPayment_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;
