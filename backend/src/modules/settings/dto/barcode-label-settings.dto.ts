import { BarcodeLabelSize } from "@prisma/client";
import { Type } from "class-transformer";
import { IsBoolean, IsEnum, IsInt, IsNumber, IsOptional, Max, Min } from "class-validator";

export class UpdateBarcodeLabelSettingsDto {
  @IsOptional()
  @IsEnum(BarcodeLabelSize)
  labelSize?: BarcodeLabelSize;

  @IsOptional()
  @IsBoolean()
  showProductName?: boolean;

  @IsOptional()
  @IsBoolean()
  showPrice?: boolean;

  @IsOptional()
  @IsBoolean()
  showBarcodeText?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(8)
  columns?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  rows?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  marginTop?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  marginRight?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  marginBottom?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  marginLeft?: number | null;
}
