import { PaymentMethod } from "@prisma/client";
import { Type } from "class-transformer";
import { ArrayMinSize, IsArray, IsBoolean, IsEnum, IsOptional, IsString, Min, ValidateNested, IsNumber } from "class-validator";

export class CreateReturnItemDto {
  @IsString()
  invoiceItemId!: string;

  @IsNumber()
  @Min(0.001)
  quantity!: number;

  @IsOptional()
  @IsBoolean()
  restocked?: boolean = true;
}

export class CreateReturnDto {
  @IsString()
  branchId!: string;

  @IsString()
  invoiceId!: string;

  @IsOptional()
  @IsString()
  shiftId?: string;

  @IsString()
  reason!: string;

  @IsEnum(PaymentMethod)
  refundMethod!: PaymentMethod;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateReturnItemDto)
  items!: CreateReturnItemDto[];
}
