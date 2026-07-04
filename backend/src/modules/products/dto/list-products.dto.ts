import { IsIn, IsInt, IsOptional, IsString, Max, Min } from "class-validator";
import { Transform } from "class-transformer";

export class ListProductsDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsIn(["ACTIVE", "INACTIVE"])
  status?: "ACTIVE" | "INACTIVE";

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;

  @IsOptional()
  @IsIn(["createdAt", "name", "sellingPrice"])
  sortBy: "createdAt" | "name" | "sellingPrice" = "createdAt";

  @IsOptional()
  @IsIn(["asc", "desc"])
  sortDir: "asc" | "desc" = "desc";
}
