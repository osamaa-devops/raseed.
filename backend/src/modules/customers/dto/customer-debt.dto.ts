import { PaymentMethod } from "@prisma/client";
import { IsEnum, IsIn, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from "class-validator";

export class GetDebtTransactionsQueryDto {
  @IsOptional()
  @IsString()
  branchId?: string;
}

export class AddDebtDto {
  @IsOptional()
  @IsString()
  branchId?: string;

  @IsNumber()
  @Min(0.01)
  amount!: number;

  @IsString()
  @IsNotEmpty()
  reason!: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class PayDebtDto {
  @IsOptional()
  @IsString()
  branchId?: string;

  @IsNumber()
  @Min(0.01)
  amount!: number;

  @IsEnum(PaymentMethod)
  paymentMethod!: PaymentMethod;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class AdjustDebtDto {
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
