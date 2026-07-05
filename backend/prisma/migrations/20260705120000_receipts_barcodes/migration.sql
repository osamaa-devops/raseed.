-- CreateEnum
CREATE TYPE "ReceiptPaperSize" AS ENUM ('MM_58', 'MM_80', 'A4');

-- CreateEnum
CREATE TYPE "BarcodeLabelSize" AS ENUM ('SMALL', 'MEDIUM', 'LARGE', 'CUSTOM');

-- CreateTable
CREATE TABLE "ReceiptSettings" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "branchId" TEXT,
    "storeName" TEXT,
    "storePhone" TEXT,
    "storeAddress" TEXT,
    "logoUrl" TEXT,
    "receiptHeader" TEXT,
    "receiptFooter" TEXT,
    "showLogo" BOOLEAN NOT NULL DEFAULT true,
    "showTaxNumber" BOOLEAN NOT NULL DEFAULT false,
    "taxNumber" TEXT,
    "showCashierName" BOOLEAN NOT NULL DEFAULT true,
    "showBranchName" BOOLEAN NOT NULL DEFAULT true,
    "showCustomerInfo" BOOLEAN NOT NULL DEFAULT true,
    "paperSize" "ReceiptPaperSize" NOT NULL DEFAULT 'MM_80',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReceiptSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BarcodeLabelSettings" (
    "id" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "labelSize" "BarcodeLabelSize" NOT NULL DEFAULT 'MEDIUM',
    "showProductName" BOOLEAN NOT NULL DEFAULT true,
    "showPrice" BOOLEAN NOT NULL DEFAULT true,
    "showBarcodeText" BOOLEAN NOT NULL DEFAULT true,
    "columns" INTEGER NOT NULL DEFAULT 3,
    "rows" INTEGER,
    "marginTop" DECIMAL(8,2),
    "marginRight" DECIMAL(8,2),
    "marginBottom" DECIMAL(8,2),
    "marginLeft" DECIMAL(8,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BarcodeLabelSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ReceiptSettings_storeId_branchId_key" ON "ReceiptSettings"("storeId", "branchId");

-- CreateIndex
CREATE UNIQUE INDEX "ReceiptSettings_storeId_default_key" ON "ReceiptSettings"("storeId") WHERE "branchId" IS NULL;

-- CreateIndex
CREATE INDEX "ReceiptSettings_storeId_idx" ON "ReceiptSettings"("storeId");

-- CreateIndex
CREATE UNIQUE INDEX "BarcodeLabelSettings_storeId_key" ON "BarcodeLabelSettings"("storeId");

-- CreateIndex
CREATE INDEX "BarcodeLabelSettings_storeId_idx" ON "BarcodeLabelSettings"("storeId");

-- AddForeignKey
ALTER TABLE "ReceiptSettings" ADD CONSTRAINT "ReceiptSettings_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ReceiptSettings" ADD CONSTRAINT "ReceiptSettings_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BarcodeLabelSettings" ADD CONSTRAINT "BarcodeLabelSettings_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE;
