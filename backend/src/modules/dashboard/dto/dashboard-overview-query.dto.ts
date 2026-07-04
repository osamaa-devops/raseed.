import { IsDateString, IsOptional, IsString } from "class-validator";

export class DashboardOverviewQueryDto {
  @IsOptional()
  @IsString()
  branchId?: string;

  @IsOptional()
  @IsDateString()
  date?: string;
}
