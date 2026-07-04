import { Body, Controller, Delete, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { RequirePermissions } from "../../common/decorators/require-permissions.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../common/guards/permissions.guard";
import type { AuthenticatedUser } from "../../common/utils/auth.types";
import { CreateHeldOrderDto } from "./dto/create-held-order.dto";
import { CreateSaleDto } from "./dto/create-sale.dto";
import { PosService } from "./pos.service";

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("pos")
export class PosController {
  constructor(private readonly posService: PosService) {}

  @RequirePermissions("pos.sell")
  @Post("sale")
  createSale(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateSaleDto) {
    return this.posService.createSale(user, dto);
  }

  @RequirePermissions("pos.view_recent_invoices")
  @Get("recent-invoices")
  recentInvoices(@CurrentUser() user: AuthenticatedUser, @Query("branchId") branchId?: string) {
    return this.posService.recentInvoices(user, branchId);
  }

  @RequirePermissions("pos.hold_order")
  @Get("held-orders")
  heldOrders(@CurrentUser() user: AuthenticatedUser, @Query("branchId") branchId?: string) {
    return this.posService.heldOrders(user, branchId);
  }

  @RequirePermissions("pos.hold_order")
  @Post("held-orders")
  createHeldOrder(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateHeldOrderDto) {
    return this.posService.createHeldOrder(user, dto);
  }

  @RequirePermissions("pos.hold_order")
  @Delete("held-orders/:id")
  deleteHeldOrder(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.posService.deleteHeldOrder(user, id);
  }
}
