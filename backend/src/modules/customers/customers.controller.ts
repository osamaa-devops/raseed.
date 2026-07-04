import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { RequirePermissions } from "../../common/decorators/require-permissions.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../common/guards/permissions.guard";
import type { AuthenticatedUser } from "../../common/utils/auth.types";
import { AddDebtDto, AdjustDebtDto, GetDebtTransactionsQueryDto, PayDebtDto } from "./dto/customer-debt.dto";
import { CreateCustomerDto } from "./dto/create-customer.dto";
import { GetCustomersQueryDto } from "./dto/get-customers-query.dto";
import { UpdateCustomerStatusDto } from "./dto/update-customer-status.dto";
import { UpdateCustomerDto } from "./dto/update-customer.dto";
import { CustomersService } from "./customers.service";

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("customers")
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @RequirePermissions("customers.view")
  @Get()
  list(@CurrentUser() user: AuthenticatedUser, @Query() query: GetCustomersQueryDto) {
    return this.customersService.list(user, query);
  }

  @RequirePermissions("customers.view")
  @Get(":id")
  get(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.customersService.get(user, id);
  }

  @RequirePermissions("customers.create")
  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateCustomerDto) {
    return this.customersService.create(user, dto);
  }

  @RequirePermissions("customers.update")
  @Patch(":id")
  update(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string, @Body() dto: UpdateCustomerDto) {
    return this.customersService.update(user, id, dto);
  }

  @RequirePermissions("customers.update")
  @Patch(":id/status")
  updateStatus(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string, @Body() dto: UpdateCustomerStatusDto) {
    return this.customersService.updateStatus(user, id, dto);
  }

  @RequirePermissions("customers.delete")
  @Delete(":id")
  delete(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.customersService.delete(user, id);
  }

  @RequirePermissions("debts.view")
  @Get(":id/debt-transactions")
  debtTransactions(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string, @Query() query: GetDebtTransactionsQueryDto) {
    return this.customersService.debtTransactions(user, id, query);
  }

  @RequirePermissions("debts.add")
  @Post(":id/debt/add")
  addDebt(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string, @Body() dto: AddDebtDto) {
    return this.customersService.addDebt(user, id, dto);
  }

  @RequirePermissions("debts.pay")
  @Post(":id/debt/payment")
  payDebt(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string, @Body() dto: PayDebtDto) {
    return this.customersService.payDebt(user, id, dto);
  }

  @RequirePermissions("debts.adjust")
  @Post(":id/debt/adjust")
  adjustDebt(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string, @Body() dto: AdjustDebtDto) {
    return this.customersService.adjustDebt(user, id, dto);
  }
}
