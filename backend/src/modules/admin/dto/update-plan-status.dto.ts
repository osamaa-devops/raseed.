import { SubscriptionPlanStatus } from "@prisma/client";
import { IsEnum } from "class-validator";

export class UpdatePlanStatusDto {
  @IsEnum(SubscriptionPlanStatus)
  status!: SubscriptionPlanStatus;
}
