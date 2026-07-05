import { SupplierPaymentMethod } from "@prisma/client";
import { Type } from "class-transformer";
import { ArrayMinSize, IsArray, IsDateString, IsEnum, IsNotEmpty, IsNumber, IsOptional, IsString, Min, ValidateNested } from "class-validator";

export class ReceivePurchaseOrderItemDto {
  @IsString()
  @IsNotEmpty()
  purchaseOrderItemId!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0.001)
  receivedQuantity!: number;

  @IsOptional()
  @IsDateString()
  expiryDate?: string;

  @IsOptional()
  @IsString()
  batchNumber?: string;
}

export class ReceivePurchaseOrderDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ReceivePurchaseOrderItemDto)
  items!: ReceivePurchaseOrderItemDto[];

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  paidAmount?: number;

  @IsOptional()
  @IsEnum(SupplierPaymentMethod)
  paymentMethod?: SupplierPaymentMethod;

  @IsOptional()
  @IsString()
  notes?: string;
}
