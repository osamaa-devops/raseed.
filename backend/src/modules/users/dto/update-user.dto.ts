import { IsIn, IsOptional, IsString, Matches, MinLength } from "class-validator";

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @Matches(/^[^\s@]+@[^\s@]+$/)
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  password?: string;

  @IsOptional()
  @IsString()
  roleId?: string;

  @IsOptional()
  @IsString()
  branchId?: string | null;

  @IsOptional()
  @IsIn(["ACTIVE", "INACTIVE", "INVITED", "DISABLED"])
  status?: "ACTIVE" | "INACTIVE" | "INVITED" | "DISABLED";
}
