import { Type } from "class-transformer";
import { IsInt, IsNumber, IsObject, IsOptional, IsString, Min } from "class-validator";

export class UpdatePlanDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  description?: string | null;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  priceMonthly?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  priceYearly?: number | null;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxUsers?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxBranches?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxProducts?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxInvoicesPerMonth?: number | null;

  @IsOptional()
  @IsObject()
  features?: Record<string, unknown> | null;
}
