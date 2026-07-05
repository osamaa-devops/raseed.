import { SupplierPaymentMethod } from "@prisma/client";
import { IsEnum, IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from "class-validator";

export class GetSupplierTransactionsQueryDto {
  @IsOptional()
  @IsString()
  branchId?: string;
}

export class SupplierPaymentDto {
  @IsOptional()
  @IsString()
  branchId?: string;

  @IsNumber()
  @Min(0.01)
  amount!: number;

  @IsEnum(SupplierPaymentMethod)
  paymentMethod!: SupplierPaymentMethod;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class SupplierAdjustDto {
  @IsOptional()
  @IsString()
  branchId?: string;

  @IsNumber()
  @Min(0.01)
  amount!: number;

  @IsIn(["IN", "OUT"])
  direction!: "IN" | "OUT";

  @IsString()
  @IsNotEmpty()
  reason!: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
