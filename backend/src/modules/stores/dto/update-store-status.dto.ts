import { IsIn } from "class-validator";

export class UpdateStoreStatusDto {
  @IsIn(["ACTIVE", "TRIAL", "SUSPENDED", "EXPIRED", "CANCELLED"])
  status!: "ACTIVE" | "TRIAL" | "SUSPENDED" | "EXPIRED" | "CANCELLED";
}
