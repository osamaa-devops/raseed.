import { Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { RequirePermissions } from "../../common/decorators/require-permissions.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../common/guards/permissions.guard";
import type { AuthenticatedUser } from "../../common/utils/auth.types";
import { CloseShiftDto } from "./dto/close-shift.dto";
import { GetShiftsQueryDto } from "./dto/get-shifts-query.dto";
import { OpenShiftDto } from "./dto/open-shift.dto";
import { ShiftsService } from "./shifts.service";

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("shifts")
export class ShiftsController {
  constructor(private readonly shiftsService: ShiftsService) {}

  @RequirePermissions("shifts.view")
  @Get("current")
  current(@CurrentUser() user: AuthenticatedUser, @Query("branchId") branchId?: string) {
    return this.shiftsService.current(user, branchId);
  }

  @RequirePermissions("shifts.open")
  @Post("open")
  open(@CurrentUser() user: AuthenticatedUser, @Body() dto: OpenShiftDto) {
    return this.shiftsService.open(user, dto);
  }

  @RequirePermissions("shifts.close")
  @Post("close")
  close(@CurrentUser() user: AuthenticatedUser, @Body() dto: CloseShiftDto) {
    return this.shiftsService.close(user, dto);
  }

  @RequirePermissions("shifts.view")
  @Get()
  list(@CurrentUser() user: AuthenticatedUser, @Query() query: GetShiftsQueryDto) {
    return this.shiftsService.list(user, query);
  }
}
