import { IsIn } from "class-validator";

export class UpdateBranchStatusDto {
  @IsIn(["ACTIVE", "INACTIVE"])
  status!: "ACTIVE" | "INACTIVE";
}
