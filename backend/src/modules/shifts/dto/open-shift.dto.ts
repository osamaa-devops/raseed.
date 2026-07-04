import { Transform } from "class-transformer";
import { IsNumber, IsOptional, IsString, Min } from "class-validator";

export class OpenShiftDto {
  @IsString()
  branchId!: string;

  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(0)
  openingCash!: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
