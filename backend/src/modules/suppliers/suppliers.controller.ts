import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { RequirePermissions } from "../../common/decorators/require-permissions.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../common/guards/permissions.guard";
import type { AuthenticatedUser } from "../../common/utils/auth.types";
import { CreateSupplierDto } from "./dto/create-supplier.dto";
import { GetSuppliersQueryDto } from "./dto/get-suppliers-query.dto";
import { GetSupplierTransactionsQueryDto, SupplierAdjustDto, SupplierPaymentDto } from "./dto/supplier-transaction.dto";
import { UpdateSupplierStatusDto } from "./dto/update-supplier-status.dto";
import { UpdateSupplierDto } from "./dto/update-supplier.dto";
import { SuppliersService } from "./suppliers.service";

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("suppliers")
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @RequirePermissions("suppliers.view")
  @Get()
  list(@CurrentUser() user: AuthenticatedUser, @Query() query: GetSuppliersQueryDto) {
    return this.suppliersService.list(user, query);
  }

  @RequirePermissions("suppliers.view")
  @Get(":id")
  get(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.suppliersService.get(user, id);
  }

  @RequirePermissions("suppliers.create")
  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateSupplierDto) {
    return this.suppliersService.create(user, dto);
  }

  @RequirePermissions("suppliers.update")
  @Patch(":id")
  update(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string, @Body() dto: UpdateSupplierDto) {
    return this.suppliersService.update(user, id, dto);
  }

  @RequirePermissions("suppliers.update")
  @Patch(":id/status")
  updateStatus(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string, @Body() dto: UpdateSupplierStatusDto) {
    return this.suppliersService.updateStatus(user, id, dto);
  }

  @RequirePermissions("suppliers.delete")
  @Delete(":id")
  delete(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.suppliersService.delete(user, id);
  }

  @RequirePermissions("suppliers.view")
  @Get(":id/transactions")
  transactions(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string, @Query() query: GetSupplierTransactionsQueryDto) {
    return this.suppliersService.transactions(user, id, query);
  }

  @RequirePermissions("suppliers.pay")
  @Post(":id/payment")
  payment(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string, @Body() dto: SupplierPaymentDto) {
    return this.suppliersService.payment(user, id, dto);
  }

  @RequirePermissions("suppliers.adjust")
  @Post(":id/adjust")
  adjust(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string, @Body() dto: SupplierAdjustDto) {
    return this.suppliersService.adjust(user, id, dto);
  }
}
