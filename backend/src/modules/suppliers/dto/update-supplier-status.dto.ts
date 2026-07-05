import { SupplierStatus } from "@prisma/client";
import { IsEnum } from "class-validator";

export class UpdateSupplierStatusDto {
  @IsEnum(SupplierStatus)
  status!: SupplierStatus;
}
