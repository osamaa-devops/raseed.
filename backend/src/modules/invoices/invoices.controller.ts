import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { RequirePermissions } from "../../common/decorators/require-permissions.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../common/guards/permissions.guard";
import type { AuthenticatedUser } from "../../common/utils/auth.types";
import { GetInvoicesQueryDto } from "./dto/get-invoices-query.dto";
import { InvoicesService } from "./invoices.service";

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("invoices")
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @RequirePermissions("invoices.view")
  @Get()
  list(@CurrentUser() user: AuthenticatedUser, @Query() query: GetInvoicesQueryDto) {
    return this.invoicesService.list(user, query);
  }

  @RequirePermissions("invoices.view")
  @Get("by-number/:invoiceNumber")
  getByNumber(@CurrentUser() user: AuthenticatedUser, @Param("invoiceNumber") invoiceNumber: string) {
    return this.invoicesService.getByNumber(user, invoiceNumber);
  }

  @RequirePermissions("invoices.view")
  @Get(":id")
  get(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.invoicesService.get(user, id);
  }
}
