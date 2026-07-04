import { InventoryMovementType } from "@prisma/client";
import { Transform } from "class-transformer";
import { IsEnum, IsIn, IsNumber, IsOptional, IsPositive, IsString } from "class-validator";

type RemovalMovementType = "REMOVE_STOCK" | "DAMAGE" | "EXPIRED";

export class RemoveStockDto {
  @IsString()
  branchId!: string;

  @IsString()
  productId!: string;

  @Transform(({ value }) => Number(value))
  @IsNumber()
  @IsPositive()
  quantity!: number;

  @IsEnum(InventoryMovementType)
  @IsIn(["REMOVE_STOCK", "DAMAGE", "EXPIRED"])
  type!: RemovalMovementType;

  @IsString()
  reason!: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
