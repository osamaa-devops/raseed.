import { IsOptional, IsString, MaxLength } from "class-validator";

export class CreateCategoryDto {
  @IsString({ message: "Category name is required." })
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  color?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  icon?: string;
}
