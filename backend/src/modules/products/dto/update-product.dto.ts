import { IsDateString, IsNumber, IsOptional, IsString, MaxLength, Min } from "class-validator";

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  @MaxLength(180)
  name?: string;

  @IsOptional()
  @IsString()
  categoryId?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  barcode?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  sku?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(800)
  description?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  imageUrl?: string | null;

  @IsOptional()
  @IsNumber()
  @Min(0, { message: "Purchase price cannot be negative." })
  purchasePrice?: number;

  @IsOptional()
  @IsNumber()
  @Min(0, { message: "Selling price cannot be negative." })
  sellingPrice?: number;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  unitType?: string;

  @IsOptional()
  @IsNumber()
  @Min(0, { message: "Minimum stock cannot be negative." })
  minStock?: number;

  @IsOptional()
  @IsDateString()
  expiryDate?: string | null;
}
