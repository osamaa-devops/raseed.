import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { RequirePermissions } from "../../common/decorators/require-permissions.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../common/guards/permissions.guard";
import type { AuthenticatedUser } from "../../common/utils/auth.types";
import { AdminService } from "./admin.service";
import { AdminPaymentsQueryDto } from "./dto/admin-payments-query.dto";
import { AdminStoresQueryDto } from "./dto/admin-stores-query.dto";
import { AdminSubscriptionsQueryDto } from "./dto/admin-subscriptions-query.dto";
import { CreateAdminStoreDto } from "./dto/create-admin-store.dto";
import { CreatePlanDto } from "./dto/create-plan.dto";
import { CreateSubscriptionPaymentDto } from "./dto/create-subscription-payment.dto";
import { RenewSubscriptionDto } from "./dto/renew-subscription.dto";
import { UpdateAdminStoreDto } from "./dto/update-admin-store.dto";
import { UpdateAdminStoreStatusDto } from "./dto/update-admin-store-status.dto";
import { UpdatePlanDto } from "./dto/update-plan.dto";
import { UpdatePlanStatusDto } from "./dto/update-plan-status.dto";
import { UpdateSubscriptionDto } from "./dto/update-subscription.dto";

@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions("admin.platform_access")
@Controller("admin")
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @RequirePermissions("admin.platform_access")
  @Get("overview")
  overview(@CurrentUser() user: AuthenticatedUser) {
    return this.adminService.overview(user);
  }

  @RequirePermissions("admin.stores.view")
  @Get("stores")
  listStores(@CurrentUser() user: AuthenticatedUser, @Query() query: AdminStoresQueryDto) {
    return this.adminService.listStores(user, query);
  }

  @RequirePermissions("admin.stores.view")
  @Get("stores/:id")
  getStore(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.adminService.getStore(user, id);
  }

  @RequirePermissions("admin.stores.create")
  @Post("stores")
  createStore(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateAdminStoreDto) {
    return this.adminService.createStore(user, dto);
  }

  @RequirePermissions("admin.stores.update")
  @Patch("stores/:id")
  updateStore(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string, @Body() dto: UpdateAdminStoreDto) {
    return this.adminService.updateStore(user, id, dto);
  }

  @RequirePermissions("admin.stores.suspend", "admin.stores.activate")
  @Patch("stores/:id/status")
  updateStoreStatus(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string, @Body() dto: UpdateAdminStoreStatusDto) {
    return this.adminService.updateStoreStatus(user, id, dto);
  }

  @RequirePermissions("admin.plans.view")
  @Get("plans")
  listPlans(@CurrentUser() user: AuthenticatedUser) {
    return this.adminService.listPlans(user);
  }

  @RequirePermissions("admin.plans.view")
  @Get("plans/:id")
  getPlan(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.adminService.getPlan(user, id);
  }

  @RequirePermissions("admin.plans.create")
  @Post("plans")
  createPlan(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreatePlanDto) {
    return this.adminService.createPlan(user, dto);
  }

  @RequirePermissions("admin.plans.update")
  @Patch("plans/:id")
  updatePlan(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string, @Body() dto: UpdatePlanDto) {
    return this.adminService.updatePlan(user, id, dto);
  }

  @RequirePermissions("admin.plans.update")
  @Patch("plans/:id/status")
  updatePlanStatus(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string, @Body() dto: UpdatePlanStatusDto) {
    return this.adminService.updatePlanStatus(user, id, dto);
  }

  @RequirePermissions("admin.subscriptions.view")
  @Get("subscriptions")
  listSubscriptions(@CurrentUser() user: AuthenticatedUser, @Query() query: AdminSubscriptionsQueryDto) {
    return this.adminService.listSubscriptions(user, query);
  }

  @RequirePermissions("admin.subscriptions.view")
  @Get("subscriptions/:id")
  getSubscription(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.adminService.getSubscription(user, id);
  }

  @RequirePermissions("admin.subscriptions.update")
  @Patch("subscriptions/:id")
  updateSubscription(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string, @Body() dto: UpdateSubscriptionDto) {
    return this.adminService.updateSubscription(user, id, dto);
  }

  @RequirePermissions("admin.subscriptions.update")
  @Post("subscriptions/:id/renew")
  renewSubscription(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string, @Body() dto: RenewSubscriptionDto) {
    return this.adminService.renewSubscription(user, id, dto);
  }

  @RequirePermissions("admin.payments.view")
  @Get("subscription-payments")
  listPayments(@CurrentUser() user: AuthenticatedUser, @Query() query: AdminPaymentsQueryDto) {
    return this.adminService.listPayments(user, query);
  }

  @RequirePermissions("admin.payments.create")
  @Post("subscription-payments")
  createPayment(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateSubscriptionPaymentDto) {
    return this.adminService.createPayment(user, dto);
  }
}
