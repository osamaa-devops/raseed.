import { Body, Controller, Get, Param, Patch, Query, UseGuards } from "@nestjs/common";
import { RequirePermissions } from "../../common/decorators/require-permissions.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../common/guards/permissions.guard";
import type { AuthenticatedUser } from "../../common/utils/auth.types";
import { DemoRequestsService } from "./demo-requests.service";
import { DemoRequestsQueryDto } from "./dto/demo-requests-query.dto";
import { UpdateDemoRequestDto } from "./dto/update-demo-request.dto";

@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions("admin.platform_access")
@Controller("admin/demo-requests")
export class AdminDemoRequestsController {
  constructor(private readonly demoRequestsService: DemoRequestsService) {}

  @Get()
  list(@Query() query: DemoRequestsQueryDto) {
    return this.demoRequestsService.list(query);
  }

  @Patch(":id")
  update(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string, @Body() dto: UpdateDemoRequestDto) {
    return this.demoRequestsService.update(id, dto, user.id);
  }
}
