import { Transform } from "class-transformer";
import { IsNumber, IsOptional, IsString, Min } from "class-validator";

export class CloseShiftDto {
  @IsString()
  shiftId!: string;

  @Transform(({ value }) => Number(value))
  @IsNumber()
  @Min(0)
  actualCash!: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
