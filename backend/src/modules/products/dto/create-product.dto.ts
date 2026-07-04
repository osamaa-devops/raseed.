import { IsDateString, IsNumber, IsOptional, IsString, MaxLength, Min } from "class-validator";

export class CreateProductDto {
  @IsString({ message: "Product name is required." })
  @MaxLength(180)
  name!: string;

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

  @IsNumber({}, { message: "Purchase price must be a number." })
  @Min(0, { message: "Purchase price cannot be negative." })
  purchasePrice!: number;

  @IsNumber({}, { message: "Selling price must be a number." })
  @Min(0, { message: "Selling price cannot be negative." })
  sellingPrice!: number;

  @IsString()
  @MaxLength(40)
  unitType!: string;

  @IsNumber()
  @Min(0, { message: "Minimum stock cannot be negative." })
  minStock!: number;

  @IsOptional()
  @IsDateString()
  expiryDate?: string | null;
}
