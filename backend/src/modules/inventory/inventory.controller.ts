import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { RequirePermissions } from "../../common/decorators/require-permissions.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../common/guards/permissions.guard";
import type { AuthenticatedUser } from "../../common/utils/auth.types";
import { AddStockDto } from "./dto/add-stock.dto";
import { AdjustStockDto } from "./dto/adjust-stock.dto";
import { CreateInventoryTransferDto } from "./dto/create-inventory-transfer.dto";
import { ExpiryAlertsQueryDto } from "./dto/expiry-alerts-query.dto";
import { GetInventoryMovementsQueryDto } from "./dto/get-inventory-movements-query.dto";
import { GetInventoryStocksQueryDto } from "./dto/get-inventory-stocks-query.dto";
import { GetInventoryTransfersQueryDto } from "./dto/get-inventory-transfers-query.dto";
import { RemoveStockDto } from "./dto/remove-stock.dto";
import { InventoryService } from "./inventory.service";

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("inventory")
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @RequirePermissions("inventory.view")
  @Get("stocks")
  stocks(@CurrentUser() user: AuthenticatedUser, @Query() query: GetInventoryStocksQueryDto) {
    return this.inventoryService.getStocks(user, query);
  }

  @RequirePermissions("inventory.view")
  @Get("stocks/:productId")
  stock(@CurrentUser() user: AuthenticatedUser, @Param("productId") productId: string, @Query("branchId") branchId?: string) {
    return this.inventoryService.getStock(user, productId, branchId);
  }

  @RequirePermissions("inventory.view_movements")
  @Get("movements")
  movements(@CurrentUser() user: AuthenticatedUser, @Query() query: GetInventoryMovementsQueryDto) {
    return this.inventoryService.getMovements(user, query);
  }

  @RequirePermissions("inventory.view_movements")
  @Get("transfers")
  transfers(@CurrentUser() user: AuthenticatedUser, @Query() query: GetInventoryTransfersQueryDto) {
    return this.inventoryService.getTransfers(user, query);
  }

  @RequirePermissions("inventory.add_stock")
  @Post("add-stock")
  addStock(@CurrentUser() user: AuthenticatedUser, @Body() dto: AddStockDto) {
    return this.inventoryService.addStock(user, dto);
  }

  @RequirePermissions("inventory.remove_stock")
  @Post("remove-stock")
  removeStock(@CurrentUser() user: AuthenticatedUser, @Body() dto: RemoveStockDto) {
    return this.inventoryService.removeStock(user, dto);
  }

  @RequirePermissions("inventory.adjust")
  @Post("adjust")
  adjust(@CurrentUser() user: AuthenticatedUser, @Body() dto: AdjustStockDto) {
    return this.inventoryService.adjustStock(user, dto);
  }

  @RequirePermissions("inventory.transfer")
  @Post("transfer")
  transfer(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateInventoryTransferDto) {
    return this.inventoryService.transferStock(user, dto);
  }

  @RequirePermissions("inventory.view_alerts")
  @Get("low-stock")
  lowStock(@CurrentUser() user: AuthenticatedUser, @Query() query: GetInventoryStocksQueryDto) {
    return this.inventoryService.getLowStock(user, query);
  }

  @RequirePermissions("inventory.view_alerts")
  @Get("expiry-alerts")
  expiryAlerts(@CurrentUser() user: AuthenticatedUser, @Query() query: ExpiryAlertsQueryDto) {
    return this.inventoryService.getExpiryAlerts(user, query);
  }
}
