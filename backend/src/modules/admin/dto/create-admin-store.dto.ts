import { BillingCycle } from "@prisma/client";
import { Type } from "class-transformer";
import { IsEmail, IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from "class-validator";

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
  @IsEmail()
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
  @IsEmail()
  ownerUserEmail?: string;

  @IsString()
  @IsNotEmpty()
  ownerUserPhone!: string;

  @IsString()
  @IsNotEmpty()
  ownerPassword!: string;

  @IsString()
  @IsNotEmpty()
  mainBranchName!: string;

  @IsOptional()
  @IsString()
  mainBranchAddress?: string;
}
