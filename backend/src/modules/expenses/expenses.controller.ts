import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { RequirePermissions } from "../../common/decorators/require-permissions.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../common/guards/permissions.guard";
import type { AuthenticatedUser } from "../../common/utils/auth.types";
import { CreateExpenseDto } from "./dto/create-expense.dto";
import { GetExpensesQueryDto } from "./dto/get-expenses-query.dto";
import { UpdateExpenseDto } from "./dto/update-expense.dto";
import { ExpensesService } from "./expenses.service";

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("expenses")
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @RequirePermissions("expenses.view")
  @Get()
  list(@CurrentUser() user: AuthenticatedUser, @Query() query: GetExpensesQueryDto) {
    return this.expensesService.list(user, query);
  }

  @RequirePermissions("expenses.view")
  @Get(":id")
  get(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.expensesService.get(user, id);
  }

  @RequirePermissions("expenses.create")
  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateExpenseDto) {
    return this.expensesService.create(user, dto);
  }

  @RequirePermissions("expenses.update")
  @Patch(":id")
  update(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string, @Body() dto: UpdateExpenseDto) {
    return this.expensesService.update(user, id, dto);
  }

  @RequirePermissions("expenses.delete")
  @Delete(":id")
  delete(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.expensesService.delete(user, id);
  }
}
