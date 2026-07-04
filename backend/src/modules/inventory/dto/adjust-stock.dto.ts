import { Transform } from "class-transformer";
import { IsNumber, IsOptional, IsString, Min } from "class-validator";

export class AdjustStockDto {
  @IsString()
  branchId!: string;

  @IsString()
  productId!: string;

  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(0)
  newQuantity!: number;

  @IsString()
  reason!: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
