import { Body, Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { RequirePermissions } from "../../common/decorators/require-permissions.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../common/guards/permissions.guard";
import type { AuthenticatedUser } from "../../common/utils/auth.types";
import { CreateReturnDto } from "./dto/create-return.dto";
import { GetReturnsQueryDto } from "./dto/get-returns-query.dto";
import { ReturnsService } from "./returns.service";

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("returns")
export class ReturnsController {
  constructor(private readonly returnsService: ReturnsService) {}

  @RequirePermissions("returns.view")
  @Get()
  list(@CurrentUser() user: AuthenticatedUser, @Query() query: GetReturnsQueryDto) {
    return this.returnsService.list(user, query);
  }

  @RequirePermissions("returns.view")
  @Get("by-number/:returnNumber")
  getByNumber(@CurrentUser() user: AuthenticatedUser, @Param("returnNumber") returnNumber: string) {
    return this.returnsService.getByNumber(user, returnNumber);
  }

  @RequirePermissions("returns.view")
  @Get(":id")
  get(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.returnsService.get(user, id);
  }

  @RequirePermissions("returns.create")
  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateReturnDto) {
    return this.returnsService.create(user, dto);
  }
}
