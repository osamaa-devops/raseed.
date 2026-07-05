import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { RequirePermissions } from "../../common/decorators/require-permissions.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../common/guards/permissions.guard";
import type { AuthenticatedUser } from "../../common/utils/auth.types";
import { CreatePurchaseOrderDto } from "./dto/create-purchase-order.dto";
import { GetPurchaseOrdersQueryDto } from "./dto/get-purchase-orders-query.dto";
import { ReceivePurchaseOrderDto } from "./dto/receive-purchase-order.dto";
import { UpdatePurchaseOrderStatusDto } from "./dto/update-purchase-order-status.dto";
import { UpdatePurchaseOrderDto } from "./dto/update-purchase-order.dto";
import { PurchaseOrdersService } from "./purchase-orders.service";

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("purchase-orders")
export class PurchaseOrdersController {
  constructor(private readonly purchaseOrdersService: PurchaseOrdersService) {}

  @RequirePermissions("purchase_orders.view")
  @Get()
  list(@CurrentUser() user: AuthenticatedUser, @Query() query: GetPurchaseOrdersQueryDto) {
    return this.purchaseOrdersService.list(user, query);
  }

  @RequirePermissions("purchase_orders.view")
  @Get(":id")
  get(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.purchaseOrdersService.get(user, id);
  }

  @RequirePermissions("purchase_orders.create")
  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreatePurchaseOrderDto) {
    return this.purchaseOrdersService.create(user, dto);
  }

  @RequirePermissions("purchase_orders.update")
  @Patch(":id")
  update(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string, @Body() dto: UpdatePurchaseOrderDto) {
    return this.purchaseOrdersService.update(user, id, dto);
  }

  @RequirePermissions("purchase_orders.update")
  @Patch(":id/status")
  updateStatus(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string, @Body() dto: UpdatePurchaseOrderStatusDto) {
    return this.purchaseOrdersService.updateStatus(user, id, dto);
  }

  @RequirePermissions("purchase_orders.receive")
  @Post(":id/receive")
  receive(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string, @Body() dto: ReceivePurchaseOrderDto) {
    return this.purchaseOrdersService.receive(user, id, dto);
  }

  @RequirePermissions("purchase_orders.cancel")
  @Delete(":id")
  delete(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.purchaseOrdersService.delete(user, id);
  }
}
