import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { RequirePermissions } from "../../common/decorators/require-permissions.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../common/guards/permissions.guard";
import type { AuthenticatedUser } from "../../common/utils/auth.types";
import { DashboardService } from "./dashboard.service";
import { DashboardOverviewQueryDto } from "./dto/dashboard-overview-query.dto";

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("dashboard")
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @RequirePermissions("dashboard.view")
  @Get("overview")
  overview(@CurrentUser() user: AuthenticatedUser, @Query() query: DashboardOverviewQueryDto) {
    return this.dashboardService.overview(user, query);
  }
}
