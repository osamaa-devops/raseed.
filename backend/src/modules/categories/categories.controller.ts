import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { RequirePermissions } from "../../common/decorators/require-permissions.decorator";
import { UpdateCatalogStatusDto } from "../../common/dto/update-catalog-status.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../common/guards/permissions.guard";
import type { AuthenticatedUser } from "../../common/utils/auth.types";
import { CategoriesService } from "./categories.service";
import { CreateCategoryDto } from "./dto/create-category.dto";
import { UpdateCategoryDto } from "./dto/update-category.dto";

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("categories")
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @RequirePermissions("categories.view")
  @Get()
  list(@CurrentUser() user: AuthenticatedUser) {
    return this.categoriesService.list(user);
  }

  @RequirePermissions("categories.view")
  @Get(":id")
  getById(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.categoriesService.getById(user, id);
  }

  @RequirePermissions("categories.create")
  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateCategoryDto) {
    return this.categoriesService.create(user, dto);
  }

  @RequirePermissions("categories.update")
  @Patch(":id")
  update(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string, @Body() dto: UpdateCategoryDto) {
    return this.categoriesService.update(user, id, dto);
  }

  @RequirePermissions("categories.update")
  @Patch(":id/status")
  updateStatus(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string, @Body() dto: UpdateCatalogStatusDto) {
    return this.categoriesService.updateStatus(user, id, dto);
  }

  @RequirePermissions("categories.delete")
  @Delete(":id")
  delete(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.categoriesService.delete(user, id);
  }
}
