import { BillingCycle } from "@prisma/client";
import { Type } from "class-transformer";
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Matches, Max, Min } from "class-validator";

export class CreateAdminStoreDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  ownerName!: string;

  @IsString()
  @IsNotEmpty()
  phone!: string;

  @IsOptional()
  @Matches(/^[^\s@]+@[^\s@]+$/)
  email?: string;

  @IsString()
  @IsNotEmpty()
  planId!: string;

  @IsEnum(BillingCycle)
  billingCycle!: BillingCycle;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(90)
  trialDays?: number;

  @IsString()
  @IsNotEmpty()
  ownerUserName!: string;

  @IsOptional()
  @Matches(/^[^\s@]+@[^\s@]+$/)
  ownerUserEmail?: string;

  @IsString()
  @IsNotEmpty()
  ownerUserPhone!: string;

  @IsString()
  @IsNotEmpty()
  ownerPassword!: string;

  @IsOptional()
  @IsString()
  cashierUserName?: string;

  @IsOptional()
  @Matches(/^[^\s@]+@[^\s@]+$/)
  cashierUserEmail?: string;

  @IsOptional()
  @IsString()
  cashierUserPhone?: string;

  @IsOptional()
  @IsString()
  cashierPassword?: string;

  @IsString()
  @IsNotEmpty()
  mainBranchName!: string;

  @IsOptional()
  @IsString()
  mainBranchAddress?: string;
}
