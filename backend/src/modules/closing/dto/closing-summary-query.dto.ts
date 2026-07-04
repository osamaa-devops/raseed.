import { IsDateString, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class ClosingSummaryQueryDto {
  @IsString()
  @IsNotEmpty()
  branchId!: string;

  @IsOptional()
  @IsDateString()
  date?: string;
}
