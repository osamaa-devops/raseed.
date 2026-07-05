import { Type } from "class-transformer";
import { IsDateString, IsEnum, IsOptional, IsString } from "class-validator";

export enum ExportFormat {
  XLSX = "xlsx",
  CSV = "csv",
}

export enum ProductImportMode {
  CREATE_ONLY = "CREATE_ONLY",
  UPSERT = "UPSERT",
}

export enum StockImportMode {
  ADD_TO_EXISTING = "ADD_TO_EXISTING",
  SET_INITIAL_QUANTITY = "SET_INITIAL_QUANTITY",
}

export class ImportProductsQueryDto {
  @IsOptional()
  @IsEnum(ProductImportMode)
  mode?: ProductImportMode = ProductImportMode.UPSERT;
}

export class ImportInitialStockQueryDto {
  @IsOptional()
  @IsEnum(StockImportMode)
  mode?: StockImportMode = StockImportMode.ADD_TO_EXISTING;
}

export class ExportQueryDto {
  @IsOptional()
  @IsEnum(ExportFormat)
  format?: ExportFormat = ExportFormat.XLSX;

  @IsOptional()
  @IsString()
  branchId?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  status?: string;
}

export class ExportInvoicesQueryDto extends ExportQueryDto {
  @IsOptional()
  @IsString()
  cashierId?: string;

  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;
}

export class ExportReportsQueryDto {
  @IsOptional()
  @IsEnum(ExportFormat)
  format?: ExportFormat = ExportFormat.XLSX;

  @IsOptional()
  @IsString()
  branchId?: string;

  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;
}
