import { Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { RequirePermissions } from "../../common/decorators/require-permissions.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../common/guards/permissions.guard";
import type { AuthenticatedUser } from "../../common/utils/auth.types";
import { ClosingService } from "./closing.service";
import { CloseDayDto } from "./dto/close-day.dto";
import { ClosingHistoryQueryDto } from "./dto/closing-history-query.dto";
import { ClosingSummaryQueryDto } from "./dto/closing-summary-query.dto";

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("closing")
export class ClosingController {
  constructor(private readonly closingService: ClosingService) {}

  @RequirePermissions("closing.view")
  @Get("summary")
  summary(@CurrentUser() user: AuthenticatedUser, @Query() query: ClosingSummaryQueryDto) {
    return this.closingService.summary(user, query);
  }

  @RequirePermissions("closing.create")
  @Post("close-day")
  closeDay(@CurrentUser() user: AuthenticatedUser, @Body() dto: CloseDayDto) {
    return this.closingService.closeDay(user, dto);
  }

  @RequirePermissions("closing.view")
  @Get("history")
  history(@CurrentUser() user: AuthenticatedUser, @Query() query: ClosingHistoryQueryDto) {
    return this.closingService.history(user, query);
  }
}
