import { Body, Controller, Get, Patch, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { RequirePermissions } from "../../common/decorators/require-permissions.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../common/guards/permissions.guard";
import type { AuthenticatedUser } from "../../common/utils/auth.types";
import { UpdateStoreDto } from "./dto/update-store.dto";
import { StoresService } from "./stores.service";

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("stores")
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  @Get("me")
  me(@CurrentUser() user: AuthenticatedUser) {
    return this.storesService.me(user);
  }

  @RequirePermissions("settings.manage")
  @Patch("me")
  updateMe(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateStoreDto) {
    return this.storesService.updateMe(user, dto);
  }
}
