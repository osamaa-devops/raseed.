import { Type } from "class-transformer";
import { IsInt, IsOptional, Max, Min } from "class-validator";

export class SubscriptionUsageQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(12)
  monthOffset?: number = 0;
}
