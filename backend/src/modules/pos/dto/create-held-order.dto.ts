import { IsObject, IsOptional, IsString } from "class-validator";

export class CreateHeldOrderDto {
  @IsString()
  branchId!: string;

  @IsObject()
  data!: Record<string, unknown>;

  @IsOptional()
  @IsString()
  note?: string;
}
