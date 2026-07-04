import { Body, Controller, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { RequirePermissions } from "../../common/decorators/require-permissions.decorator";
import { RequireRoles } from "../../common/decorators/require-roles.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../common/guards/permissions.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import type { AuthenticatedUser } from "../../common/utils/auth.types";
import { CreateStoreDto } from "./dto/create-store.dto";
import { UpdateStoreStatusDto } from "./dto/update-store-status.dto";
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

@UseGuards(JwtAuthGuard, RolesGuard)
@RequireRoles("super_admin")
@Controller("admin/stores")
export class AdminStoresController {
  constructor(private readonly storesService: StoresService) {}

  @Get()
  list() {
    return this.storesService.listAdmin();
  }

  @Get(":id")
  getById(@Param("id") id: string) {
    return this.storesService.getAdmin(id);
  }

  @Post()
  create(@Body() dto: CreateStoreDto) {
    return this.storesService.createAdmin(dto);
  }

  @Patch(":id/status")
  updateStatus(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string, @Body() dto: UpdateStoreStatusDto) {
    return this.storesService.updateStatusAdmin(user, id, dto);
  }
}
