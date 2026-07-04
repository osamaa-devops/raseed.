import { Transform } from "class-transformer";
import { IsDateString, IsNumber, IsOptional, IsPositive, IsString } from "class-validator";

export class AddStockDto {
  @IsString()
  branchId!: string;

  @IsString()
  productId!: string;

  @Transform(({ value }) => Number(value))
  @IsNumber()
  @IsPositive()
  quantity!: number;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsNumber()
  @IsPositive()
  purchasePrice?: number;

  @IsOptional()
  @IsDateString()
  expiryDate?: string;

  @IsOptional()
  @IsString()
  batchNumber?: string;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
