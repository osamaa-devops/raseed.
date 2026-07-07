import { CatalogStatus, ProductGender, ProductSeason } from "@prisma/client";
import { IsEnum, IsInt, IsNumber, IsOptional, IsString, MaxLength, Min } from "class-validator";

export class ProductVariantDto {
  @IsString()
  @MaxLength(60)
  size!: string;

  @IsString()
  @MaxLength(60)
  color!: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  sku?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  barcode?: string | null;

  @IsNumber()
  @Min(0)
  costPrice!: number;

  @IsNumber()
  @Min(0)
  sellingPrice!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  discountPrice?: number | null;

  @IsInt()
  @Min(0)
  stockQuantity!: number;

  @IsInt()
  @Min(0)
  minStock!: number;

  @IsOptional()
  @IsEnum(CatalogStatus)
  status?: CatalogStatus;
}

export class ProductCoreDto {
  @IsString()
  @MaxLength(180)
  name!: string;

  @IsOptional()
  @IsString()
  categoryId?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  brand?: string | null;

  @IsOptional()
  @IsEnum(ProductGender)
  gender?: ProductGender;

  @IsOptional()
  @IsEnum(ProductSeason)
  season?: ProductSeason;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  imageUrl?: string | null;

  @IsOptional()
  @IsEnum(CatalogStatus)
  status?: CatalogStatus;
}
