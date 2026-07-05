import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { RequirePermissions } from "../../common/decorators/require-permissions.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../common/guards/permissions.guard";
import type { AuthenticatedUser } from "../../common/utils/auth.types";
import { SubscriptionUsageQueryDto } from "./dto/subscription-query.dto";
import { SubscriptionService } from "./subscription.service";

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("subscription")
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @RequirePermissions("subscription.view")
  @Get("me")
  me(@CurrentUser() user: AuthenticatedUser) {
    return this.subscriptionService.me(user);
  }

  @RequirePermissions("subscription.view")
  @Get("usage")
  usage(@CurrentUser() user: AuthenticatedUser, @Query() _query: SubscriptionUsageQueryDto) {
    return this.subscriptionService.usage(user);
  }
}
