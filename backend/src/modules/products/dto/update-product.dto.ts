import { IsArray, IsOptional, IsString, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { ProductCoreDto, ProductVariantDto } from "./product-variant.dto";

export class UpdateProductDto extends ProductCoreDto {
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
