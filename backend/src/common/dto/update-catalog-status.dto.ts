import { IsIn } from "class-validator";

export class UpdateCatalogStatusDto {
  @IsIn(["ACTIVE", "INACTIVE"], { message: "Status must be ACTIVE or INACTIVE." })
  status!: "ACTIVE" | "INACTIVE";
}
