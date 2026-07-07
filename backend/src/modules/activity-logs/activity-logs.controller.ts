import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { RequirePermissions } from "../../common/decorators/require-permissions.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../common/guards/permissions.guard";
import type { AuthenticatedUser } from "../../common/utils/auth.types";
import { ActivityLogsQueryDto } from "./dto/activity-logs-query.dto";
import { ActivityLogsService } from "./activity-logs.service";

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("activity-logs")
export class ActivityLogsController {
  constructor(private readonly activityLogsService: ActivityLogsService) {}

  @RequirePermissions("activity_logs.view")
  @Get()
  list(@CurrentUser() user: AuthenticatedUser, @Query() query: ActivityLogsQueryDto) {
    return this.activityLogsService.list(user, query);
  }
}
