import { IsIn, IsOptional, IsString, Matches, MinLength } from "class-validator";

export class CreateUserDto {
  @IsString()
  name!: string;

  @IsOptional()
  @Matches(/^[^\s@]+@[^\s@]+$/)
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsString()
  roleId!: string;

  @IsOptional()
  @IsString()
  branchId?: string;

  @IsOptional()
  @IsIn(["ACTIVE", "INACTIVE", "INVITED", "DISABLED"])
  status?: "ACTIVE" | "INACTIVE" | "INVITED" | "DISABLED";
}
