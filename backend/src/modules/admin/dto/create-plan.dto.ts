import { Type } from "class-transformer";
import { IsInt, IsNotEmpty, IsNumber, IsObject, IsOptional, IsString, Min } from "class-validator";

export class CreatePlanDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  code!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  priceMonthly!: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  priceYearly?: number | null;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxUsers!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxBranches!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxProducts!: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxInvoicesPerMonth?: number | null;

  @IsOptional()
  @IsObject()
  features?: Record<string, unknown>;
}
