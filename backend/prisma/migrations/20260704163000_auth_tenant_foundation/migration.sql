-- Auth and tenant foundation fields.
ALTER TYPE "StoreStatus" ADD VALUE IF NOT EXISTS 'EXPIRED';
ALTER TYPE "UserStatus" ADD VALUE IF NOT EXISTS 'INACTIVE';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'BranchStatus') THEN
    CREATE TYPE "BranchStatus" AS ENUM ('ACTIVE', 'INACTIVE');
  END IF;
END $$;

ALTER TABLE "Store"
  ADD COLUMN IF NOT EXISTS "ownerName" TEXT,
  ADD COLUMN IF NOT EXISTS "email" TEXT;

ALTER TABLE "Branch"
  ADD COLUMN IF NOT EXISTS "status" "BranchStatus" NOT NULL DEFAULT 'ACTIVE',
  ADD COLUMN IF NOT EXISTS "isMain" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "User"
  ALTER COLUMN "storeId" DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS "lastLoginAt" TIMESTAMP(3);

ALTER TABLE "Role"
  ALTER COLUMN "storeId" DROP NOT NULL;

ALTER TABLE "ActivityLog"
  ALTER COLUMN "storeId" DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS "branchId" TEXT,
  ADD COLUMN IF NOT EXISTS "entityType" TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ActivityLog_branchId_fkey'
  ) THEN
    ALTER TABLE "ActivityLog"
      ADD CONSTRAINT "ActivityLog_branchId_fkey"
      FOREIGN KEY ("branchId") REFERENCES "Branch"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "ActivityLog_branchId_idx" ON "ActivityLog"("branchId");
