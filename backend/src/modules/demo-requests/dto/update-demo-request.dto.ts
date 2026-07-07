import { DemoRequestStatus } from "@prisma/client";
import { IsEnum, IsOptional, IsString, MaxLength } from "class-validator";

export class UpdateDemoRequestDto {
  @IsOptional()
  @IsEnum(DemoRequestStatus)
  status?: DemoRequestStatus;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
