import { Type } from "class-transformer";
import { ArrayMinSize, IsArray, IsOptional, IsString, ValidateNested } from "class-validator";
import { ProductCoreDto, ProductVariantDto } from "./product-variant.dto";

export class CreateProductDto extends ProductCoreDto {
  @IsOptional()
  @IsString()
  barcode?: string | null;

  @IsOptional()
  @IsString()
  sku?: string | null;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @IsString()
  unitType?: string | null;

  @IsOptional()
  @IsString()
  expiryDate?: string | null;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ProductVariantDto)
  variants?: ProductVariantDto[];

  @IsOptional()
  purchasePrice?: number;

  @IsOptional()
  sellingPrice?: number;

  @IsOptional()
  minStock?: number;

  @IsOptional()
  stockQuantity?: number;
}
