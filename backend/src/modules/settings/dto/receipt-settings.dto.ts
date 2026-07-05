import { ReceiptPaperSize } from "@prisma/client";
import { IsBoolean, IsEnum, IsOptional, IsString, MaxLength } from "class-validator";

export class ReceiptSettingsQueryDto {
  @IsOptional()
  @IsString()
  branchId?: string;
}

export class UpdateReceiptSettingsDto {
  @IsOptional()
  @IsString()
  branchId?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  storeName?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(60)
  storePhone?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  storeAddress?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  logoUrl?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  receiptHeader?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  receiptFooter?: string | null;

  @IsOptional()
  @IsBoolean()
  showLogo?: boolean;

  @IsOptional()
  @IsBoolean()
  showTaxNumber?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  taxNumber?: string | null;

  @IsOptional()
  @IsBoolean()
  showCashierName?: boolean;

  @IsOptional()
  @IsBoolean()
  showBranchName?: boolean;

  @IsOptional()
  @IsBoolean()
  showCustomerInfo?: boolean;

  @IsOptional()
  @IsEnum(ReceiptPaperSize)
  paperSize?: ReceiptPaperSize;
}
