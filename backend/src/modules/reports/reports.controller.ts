import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { RequirePermissions } from "../../common/decorators/require-permissions.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../common/guards/permissions.guard";
import type { AuthenticatedUser } from "../../common/utils/auth.types";
import { ReportQueryDto } from "./dto/report-query.dto";
import { ReportsService } from "./reports.service";

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("reports")
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @RequirePermissions("reports.view")
  @Get("daily-sales")
  dailySales(@CurrentUser() user: AuthenticatedUser, @Query() query: ReportQueryDto) {
    return this.reportsService.dailySales(user, query);
  }

  @RequirePermissions("reports.view")
  @Get("monthly-sales")
  monthlySales(@CurrentUser() user: AuthenticatedUser, @Query() query: ReportQueryDto) {
    return this.reportsService.monthlySales(user, query);
  }

  @RequirePermissions("reports.view")
  @Get("profit")
  profit(@CurrentUser() user: AuthenticatedUser, @Query() query: ReportQueryDto) {
    return this.reportsService.profit(user, query);
  }

  @RequirePermissions("reports.view")
  @Get("payment-methods")
  paymentMethods(@CurrentUser() user: AuthenticatedUser, @Query() query: ReportQueryDto) {
    return this.reportsService.paymentMethods(user, query);
  }

  @RequirePermissions("reports.view")
  @Get("cashier-performance")
  cashierPerformance(@CurrentUser() user: AuthenticatedUser, @Query() query: ReportQueryDto) {
    return this.reportsService.cashierPerformance(user, query);
  }

  @RequirePermissions("reports.view")
  @Get("best-selling-products")
  bestSellingProducts(@CurrentUser() user: AuthenticatedUser, @Query() query: ReportQueryDto) {
    return this.reportsService.productSales(user, query, "desc");
  }

  @RequirePermissions("reports.view")
  @Get("worst-selling-products")
  worstSellingProducts(@CurrentUser() user: AuthenticatedUser, @Query() query: ReportQueryDto) {
    return this.reportsService.worstSellingProducts(user, query);
  }

  @RequirePermissions("reports.view")
  @Get("inventory-value")
  inventoryValue(@CurrentUser() user: AuthenticatedUser, @Query() query: ReportQueryDto) {
    return this.reportsService.inventoryValue(user, query);
  }

  @RequirePermissions("reports.view")
  @Get("low-stock")
  lowStock(@CurrentUser() user: AuthenticatedUser, @Query() query: ReportQueryDto) {
    return this.reportsService.lowStock(user, query);
  }

  @RequirePermissions("reports.view")
  @Get("expenses")
  expenses(@CurrentUser() user: AuthenticatedUser, @Query() query: ReportQueryDto) {
    return this.reportsService.expenses(user, query);
  }
}
