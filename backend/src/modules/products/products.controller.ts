import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { RequirePermissions } from "../../common/decorators/require-permissions.decorator";
import { UpdateCatalogStatusDto } from "../../common/dto/update-catalog-status.dto";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../common/guards/permissions.guard";
import type { AuthenticatedUser } from "../../common/utils/auth.types";
import { CreateProductDto } from "./dto/create-product.dto";
import { ListProductsDto } from "./dto/list-products.dto";
import { UpdateProductDto } from "./dto/update-product.dto";
import { ProductsService } from "./products.service";

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("products")
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @RequirePermissions("products.view")
  @Get()
  list(@CurrentUser() user: AuthenticatedUser, @Query() query: ListProductsDto) {
    return this.productsService.list(user, query);
  }

  @RequirePermissions("products.view")
  @Get(":id")
  getById(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.productsService.getById(user, id);
  }

  @RequirePermissions("products.create")
  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateProductDto) {
    return this.productsService.create(user, dto);
  }

  @RequirePermissions("products.update")
  @Patch(":id")
  update(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(user, id, dto);
  }

  @RequirePermissions("products.update")
  @Patch(":id/status")
  updateStatus(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string, @Body() dto: UpdateCatalogStatusDto) {
    return this.productsService.updateStatus(user, id, dto);
  }

  @RequirePermissions("products.delete")
  @Delete(":id")
  delete(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.productsService.delete(user, id);
  }
}
