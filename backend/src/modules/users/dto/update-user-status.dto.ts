import { IsIn } from "class-validator";

export class UpdateUserStatusDto {
  @IsIn(["ACTIVE", "INACTIVE", "INVITED", "DISABLED"])
  status!: "ACTIVE" | "INACTIVE" | "INVITED" | "DISABLED";
}
