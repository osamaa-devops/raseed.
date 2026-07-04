import { IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class CloseDayDto {
  @IsString()
  @IsNotEmpty()
  branchId!: string;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsNumber()
  actualCash!: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
