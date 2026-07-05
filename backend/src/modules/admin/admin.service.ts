import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { BillingCycle, Prisma, StoreStatus, SubscriptionPaymentStatus, SubscriptionStatus, SubscriptionPlanStatus } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import { PrismaService } from "../../prisma/prisma.service";
import type { AuthenticatedUser } from "../../common/utils/auth.types";
import { ActivityLogsService } from "../activity-logs/activity-logs.service";
import { SubscriptionService } from "../subscription/subscription.service";
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

const subscriptionWithPlanInclude = {
  plan: true,
  payments: { orderBy: { createdAt: "desc" }, take: 10 },
} as const;

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLogs: ActivityLogsService,
    private readonly subscriptions: SubscriptionService,
  ) {}

  async overview(user: AuthenticatedUser) {
    this.requirePlatformAccess(user);
    const [storeCounts, expiringSoonSubscriptions, recentStores, recentPayments, activeSubscriptions] = await Promise.all([
      this.prisma.store.groupBy({ by: ["status"], _count: { _all: true } }),
      this.prisma.subscription.count({
        where: {
          status: { in: ["ACTIVE", "TRIAL"] },
          endDate: { gte: new Date(), lte: addDays(new Date(), 7) },
        },
      }),
      this.prisma.store.findMany({ orderBy: { createdAt: "desc" }, take: 5 }),
      this.prisma.subscriptionPayment.findMany({
        where: { status: "PAID" },
        include: { store: true, subscription: { include: { plan: true } } },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      this.prisma.subscription.findMany({
        where: { status: "ACTIVE" },
        include: { plan: true },
      }),
    ]);

    const countFor = (status: StoreStatus) => storeCounts.find((item) => item.status === status)?._count._all ?? 0;
    const monthlyRecurringRevenue = activeSubscriptions.reduce((sum, item) => sum + Number(item.plan.priceMonthly), 0);
    const yearlyRecurringRevenue = activeSubscriptions.reduce((sum, item) => sum + Number(item.plan.priceYearly ?? 0), 0);

    return {
      totalStores: storeCounts.reduce((sum, item) => sum + item._count._all, 0),
      activeStores: countFor("ACTIVE"),
      trialStores: countFor("TRIAL"),
      expiredStores: countFor("EXPIRED"),
      suspendedStores: countFor("SUSPENDED"),
      monthlyRecurringRevenue,
      yearlyRecurringRevenue,
      expiringSoonSubscriptions,
      recentStores,
      recentPayments: recentPayments.map((payment) => this.serializePayment(payment)),
    };
  }

  async listStores(user: AuthenticatedUser, query: AdminStoresQueryDto) {
    this.requirePlatformAccess(user);
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const search = query.search?.trim();
    const where: Prisma.StoreWhereInput = {
      status: query.status,
      OR: search
        ? [
            { name: { contains: search, mode: "insensitive" } },
            { ownerName: { contains: search, mode: "insensitive" } },
            { phone: { contains: search, mode: "insensitive" } },
            { email: { contains: search, mode: "insensitive" } },
          ]
        : undefined,
      subscriptions: query.planId || query.subscriptionStatus
        ? {
            some: {
              planId: query.planId,
              status: query.subscriptionStatus,
            },
          }
        : undefined,
    };
    const [stores, total] = await this.prisma.$transaction([
      this.prisma.store.findMany({
        where,
        include: {
          subscriptions: { include: { plan: true }, orderBy: [{ endDate: "desc" }, { createdAt: "desc" }], take: 1 },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.store.count({ where }),
    ]);

    const items = await Promise.all(stores.map(async (store) => ({
      ...store,
      currentSubscription: store.subscriptions[0] ? this.serializeSubscription(store.subscriptions[0]) : null,
      usage: await this.subscriptions.getUsageSummary(store.id),
    })));

    return { items, meta: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async getStore(user: AuthenticatedUser, id: string) {
    this.requirePlatformAccess(user);
    const store = await this.prisma.store.findUnique({
      where: { id },
      include: {
        branches: { orderBy: { createdAt: "asc" } },
        subscriptions: { include: subscriptionWithPlanInclude, orderBy: [{ endDate: "desc" }, { createdAt: "desc" }], take: 1 },
      },
    });
    if (!store) throw new NotFoundException("Store not found.");
    const [users, usage, recentActivity, recentPayments] = await Promise.all([
      this.prisma.user.findMany({ where: { storeId: id }, include: { role: true }, orderBy: { createdAt: "desc" } }),
      this.subscriptions.getUsageSummary(id),
      this.prisma.activityLog.findMany({ where: { storeId: id }, orderBy: { createdAt: "desc" }, take: 10 }),
      this.prisma.subscriptionPayment.findMany({
        where: { storeId: id },
        include: { subscription: { include: { plan: true } } },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
    ]);

    return {
      ...store,
      currentSubscription: store.subscriptions[0] ? this.serializeSubscription(store.subscriptions[0]) : null,
      usersSummary: {
        total: users.length,
        byRole: users.reduce<Record<string, number>>((acc, item) => {
          const key = item.role?.name ?? "unassigned";
          acc[key] = (acc[key] ?? 0) + 1;
          return acc;
        }, {}),
      },
      usage,
      recentActivity,
      recentPayments: recentPayments.map((payment) => this.serializePayment(payment)),
    };
  }

  async createStore(user: AuthenticatedUser, dto: CreateAdminStoreDto) {
    this.requirePlatformAccess(user);
    const plan = await this.getActivePlan(dto.planId);
    const storeStatus = dto.trialDays || dto.billingCycle === BillingCycle.TRIAL ? StoreStatus.TRIAL : StoreStatus.ACTIVE;
    const subscriptionStatus = storeStatus === StoreStatus.TRIAL ? SubscriptionStatus.TRIAL : SubscriptionStatus.ACTIVE;
    const now = new Date();
    const trialEndsAt = dto.trialDays ? addDays(now, dto.trialDays) : dto.billingCycle === BillingCycle.TRIAL ? addDays(now, 14) : null;
    const endDate = dto.billingCycle === BillingCycle.YEARLY ? addMonths(now, 12) : dto.billingCycle === BillingCycle.MONTHLY ? addMonths(now, 1) : trialEndsAt;

    return this.prisma.$transaction(async (tx) => {
      const existingStore = await tx.store.findFirst({
        where: { OR: [{ phone: dto.phone }, dto.email ? { email: dto.email.toLowerCase() } : undefined].filter(Boolean) as Prisma.StoreWhereInput[] },
      });
      if (existingStore) throw new ConflictException("A store with the same phone or email already exists.");

      const store = await tx.store.create({
        data: {
          name: dto.name.trim(),
          ownerName: dto.ownerName.trim(),
          phone: dto.phone.trim(),
          email: dto.email?.trim().toLowerCase(),
          status: storeStatus,
        },
      });

      const branch = await tx.branch.create({
        data: {
          storeId: store.id,
          name: dto.mainBranchName.trim(),
          address: dto.mainBranchAddress?.trim(),
          isMain: true,
          isDefault: true,
          status: "ACTIVE",
        },
      });

      const ownerRole = await this.ensureOwnerRole(tx, store.id);
      const ownerUser = await tx.user.create({
        data: {
          storeId: store.id,
          branchId: branch.id,
          roleId: ownerRole.id,
          name: dto.ownerUserName.trim(),
          email: dto.ownerUserEmail?.trim().toLowerCase(),
          phone: dto.ownerUserPhone.trim(),
          passwordHash: await bcrypt.hash(dto.ownerPassword, 12),
          status: "ACTIVE",
        },
      });

      const subscription = await tx.subscription.create({
        data: {
          storeId: store.id,
          planId: plan.id,
          status: subscriptionStatus,
          startDate: now,
          endDate,
          trialEndsAt,
          billingCycle: dto.billingCycle,
          amount: getPlanAmount(plan, dto.billingCycle),
          notes: "Created by platform admin",
        },
        include: { plan: true },
      });

      await tx.activityLog.create({
        data: {
          userId: user.id,
          storeId: store.id,
          branchId: branch.id,
          action: "admin.store_created",
          entityType: "Store",
          entityId: store.id,
          metadata: { planId: plan.id, billingCycle: dto.billingCycle, ownerUserId: ownerUser.id },
        },
      });

      return { store, branch, ownerUser, subscription: this.serializeSubscription(subscription) };
    });
  }

  async updateStore(user: AuthenticatedUser, id: string, dto: UpdateAdminStoreDto) {
    this.requirePlatformAccess(user);
    const store = await this.prisma.store.update({
      where: { id },
      data: {
        name: dto.name?.trim(),
        ownerName: dto.ownerName?.trim(),
        phone: dto.phone?.trim(),
        email: dto.email === null ? null : dto.email?.trim().toLowerCase(),
      },
    });
    await this.log(user, id, "admin.store_updated", { storeId: id });
    return store;
  }

  async updateStoreStatus(user: AuthenticatedUser, id: string, dto: UpdateAdminStoreStatusDto) {
    this.requirePlatformAccess(user);
    const subscription = await this.prisma.subscription.findFirst({
      where: { storeId: id },
      orderBy: [{ endDate: "desc" }, { createdAt: "desc" }],
    });

    const store = await this.prisma.$transaction(async (tx) => {
      const updatedStore = await tx.store.update({ where: { id }, data: { status: dto.status } });
      if (subscription) {
        const nextSubscriptionStatus = dto.status === "SUSPENDED"
          ? SubscriptionStatus.SUSPENDED
          : dto.status === "EXPIRED"
            ? SubscriptionStatus.EXPIRED
            : dto.status === "ACTIVE"
              ? SubscriptionStatus.ACTIVE
              : dto.status === "TRIAL"
                ? SubscriptionStatus.TRIAL
                : undefined;
        if (nextSubscriptionStatus) {
          await tx.subscription.update({ where: { id: subscription.id }, data: { status: nextSubscriptionStatus } });
        }
      }
      await tx.activityLog.create({
        data: {
          storeId: id,
          userId: user.id,
          action: dto.status === "SUSPENDED" ? "admin.store_suspended" : dto.status === "ACTIVE" ? "admin.store_activated" : "admin.store_status_changed",
          entityType: "Store",
          entityId: id,
          metadata: { status: dto.status },
        },
      });
      return updatedStore;
    });

    return store;
  }

  async listPlans(user: AuthenticatedUser) {
    this.requirePlatformAccess(user);
    const plans = await this.prisma.subscriptionPlan.findMany({
      include: { _count: { select: { subscriptions: true } } },
      orderBy: { createdAt: "asc" },
    });
    return plans.map((plan) => this.serializePlan(plan));
  }

  async getPlan(user: AuthenticatedUser, id: string) {
    this.requirePlatformAccess(user);
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id },
      include: { _count: { select: { subscriptions: true } } },
    });
    if (!plan) throw new NotFoundException("Plan not found.");
    return this.serializePlan(plan);
  }

  async createPlan(user: AuthenticatedUser, dto: CreatePlanDto) {
    this.requirePlatformAccess(user);
    const plan = await this.prisma.subscriptionPlan.create({
      data: {
        name: dto.name.trim(),
        code: dto.code.trim().toLowerCase(),
        description: dto.description?.trim(),
        priceMonthly: new Prisma.Decimal(dto.priceMonthly),
        priceYearly: dto.priceYearly === null || dto.priceYearly === undefined ? null : new Prisma.Decimal(dto.priceYearly),
        maxUsers: dto.maxUsers,
        maxBranches: dto.maxBranches,
        maxProducts: dto.maxProducts,
        maxInvoicesPerMonth: dto.maxInvoicesPerMonth ?? null,
        features: dto.features as Prisma.InputJsonObject | undefined,
      },
      include: { _count: { select: { subscriptions: true } } },
    });
    await this.log(user, null, "admin.plan_created", { planId: plan.id, code: plan.code });
    return this.serializePlan(plan);
  }

  async updatePlan(user: AuthenticatedUser, id: string, dto: UpdatePlanDto) {
    this.requirePlatformAccess(user);
    const plan = await this.prisma.subscriptionPlan.update({
      where: { id },
      data: {
        name: dto.name?.trim(),
        code: dto.code?.trim().toLowerCase(),
        description: dto.description === null ? null : dto.description?.trim(),
        priceMonthly: dto.priceMonthly !== undefined ? new Prisma.Decimal(dto.priceMonthly) : undefined,
        priceYearly: dto.priceYearly === null ? null : dto.priceYearly !== undefined ? new Prisma.Decimal(dto.priceYearly) : undefined,
        maxUsers: dto.maxUsers,
        maxBranches: dto.maxBranches,
        maxProducts: dto.maxProducts,
        maxInvoicesPerMonth: dto.maxInvoicesPerMonth === null ? null : dto.maxInvoicesPerMonth,
        features: dto.features === null ? Prisma.JsonNull : dto.features as Prisma.InputJsonObject | undefined,
      },
      include: { _count: { select: { subscriptions: true } } },
    });
    await this.log(user, null, "admin.plan_updated", { planId: plan.id, code: plan.code });
    return this.serializePlan(plan);
  }

  async updatePlanStatus(user: AuthenticatedUser, id: string, dto: UpdatePlanStatusDto) {
    this.requirePlatformAccess(user);
    const plan = await this.prisma.subscriptionPlan.update({
      where: { id },
      data: { status: dto.status },
      include: { _count: { select: { subscriptions: true } } },
    });
    await this.log(user, null, "admin.plan_status_updated", { planId: plan.id, status: dto.status });
    return this.serializePlan(plan);
  }

  async listSubscriptions(user: AuthenticatedUser, query: AdminSubscriptionsQueryDto) {
    this.requirePlatformAccess(user);
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.SubscriptionWhereInput = {
      status: query.status,
      planId: query.planId,
      storeId: query.storeId,
      endDate: query.expiringSoon === "true" ? { gte: new Date(), lte: addDays(new Date(), 7) } : undefined,
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.subscription.findMany({
        where,
        include: { store: true, plan: true, payments: { orderBy: { createdAt: "desc" }, take: 3 } },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.subscription.count({ where }),
    ]);
    return {
      items: items.map((item) => this.serializeSubscription(item)),
      meta: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  async getSubscription(user: AuthenticatedUser, id: string) {
    this.requirePlatformAccess(user);
    const subscription = await this.prisma.subscription.findUnique({
      where: { id },
      include: { store: true, plan: true, payments: { orderBy: { createdAt: "desc" } } },
    });
    if (!subscription) throw new NotFoundException("Subscription not found.");
    return this.serializeSubscription(subscription);
  }

  async updateSubscription(user: AuthenticatedUser, id: string, dto: UpdateSubscriptionDto) {
    this.requirePlatformAccess(user);
    if (dto.planId) await this.getActivePlan(dto.planId, true);
    const subscription = await this.prisma.subscription.update({
      where: { id },
      data: {
        planId: dto.planId,
        status: dto.status,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate === null ? null : dto.endDate ? new Date(dto.endDate) : undefined,
        trialEndsAt: dto.trialEndsAt === null ? null : dto.trialEndsAt ? new Date(dto.trialEndsAt) : undefined,
        billingCycle: dto.billingCycle,
        notes: dto.notes === null ? null : dto.notes?.trim(),
      },
      include: { store: true, plan: true, payments: { orderBy: { createdAt: "desc" }, take: 3 } },
    });
    await this.syncStoreStatusFromSubscription(subscription.storeId, subscription.status);
    await this.log(user, subscription.storeId, "admin.subscription_updated", { subscriptionId: subscription.id, status: subscription.status });
    return this.serializeSubscription(subscription);
  }

  async renewSubscription(user: AuthenticatedUser, id: string, dto: RenewSubscriptionDto) {
    this.requirePlatformAccess(user);
    const subscription = await this.prisma.subscription.findUnique({ where: { id }, include: { plan: true, store: true } });
    if (!subscription) throw new NotFoundException("Subscription not found.");
    const months = dto.months ?? 1;
    const baseDate = subscription.endDate && subscription.endDate > new Date() ? subscription.endDate : new Date();
    const newEndDate = addMonths(baseDate, months);
    const renewalBillingCycle = months >= 12 ? BillingCycle.YEARLY : BillingCycle.MONTHLY;

    const renewed = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.subscription.update({
        where: { id },
        data: {
          status: "ACTIVE",
          endDate: newEndDate,
          trialEndsAt: null,
          billingCycle: renewalBillingCycle,
          amount: new Prisma.Decimal(dto.amount),
          notes: dto.notes?.trim() ?? subscription.notes,
        },
        include: { store: true, plan: true, payments: { orderBy: { createdAt: "desc" }, take: 3 } },
      });
      await tx.store.update({ where: { id: subscription.storeId }, data: { status: "ACTIVE" } });
      await tx.subscriptionPayment.create({
        data: {
          storeId: subscription.storeId,
          subscriptionId: subscription.id,
          amount: new Prisma.Decimal(dto.amount),
          method: dto.paymentMethod,
          status: "PAID",
          paidAt: new Date(),
          reference: dto.reference?.trim(),
          notes: dto.notes?.trim(),
        },
      });
      await tx.activityLog.create({
        data: {
          storeId: subscription.storeId,
          userId: user.id,
          action: "admin.subscription_renewed",
          entityType: "Subscription",
          entityId: subscription.id,
          metadata: { months, amount: dto.amount, newEndDate, billingCycle: renewalBillingCycle },
        },
      });
      return updated;
    });

    return this.serializeSubscription(renewed);
  }

  async listPayments(user: AuthenticatedUser, query: AdminPaymentsQueryDto) {
    this.requirePlatformAccess(user);
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.SubscriptionPaymentWhereInput = {
      storeId: query.storeId,
      subscriptionId: query.subscriptionId,
      status: query.status,
      createdAt: {
        gte: query.dateFrom ? new Date(query.dateFrom) : undefined,
        lte: query.dateTo ? new Date(query.dateTo) : undefined,
      },
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.subscriptionPayment.findMany({
        where,
        include: { store: true, subscription: { include: { plan: true } } },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.subscriptionPayment.count({ where }),
    ]);
    return { items: items.map((item) => this.serializePayment(item)), meta: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async createPayment(user: AuthenticatedUser, dto: CreateSubscriptionPaymentDto) {
    this.requirePlatformAccess(user);
    const subscription = await this.prisma.subscription.findFirst({
      where: { id: dto.subscriptionId, storeId: dto.storeId },
      include: { plan: true, store: true },
    });
    if (!subscription) throw new BadRequestException("Subscription does not belong to this store.");
    const payment = await this.prisma.subscriptionPayment.create({
      data: {
        storeId: dto.storeId,
        subscriptionId: dto.subscriptionId,
        amount: new Prisma.Decimal(dto.amount),
        method: dto.method,
        status: dto.status,
        paidAt: dto.paidAt ? new Date(dto.paidAt) : dto.status === SubscriptionPaymentStatus.PAID ? new Date() : undefined,
        reference: dto.reference?.trim(),
        notes: dto.notes?.trim(),
      },
      include: { store: true, subscription: { include: { plan: true } } },
    });
    await this.log(user, dto.storeId, "admin.subscription_payment_added", { paymentId: payment.id, amount: dto.amount, status: dto.status });
    return this.serializePayment(payment);
  }

  private requirePlatformAccess(user: AuthenticatedUser) {
    if (!user.isSuperAdmin && !user.permissions.includes("admin.platform_access")) {
      throw new ForbiddenException("Platform admin access is required.");
    }
  }

  private async getActivePlan(planId: string, allowInactive = false) {
    const plan = await this.prisma.subscriptionPlan.findUnique({ where: { id: planId } });
    if (!plan) throw new NotFoundException("Plan not found.");
    if (!allowInactive && plan.status !== SubscriptionPlanStatus.ACTIVE) {
      throw new BadRequestException("Plan is inactive.");
    }
    return plan;
  }

  private async ensureOwnerRole(tx: Prisma.TransactionClient, storeId: string) {
    let role = await tx.role.findFirst({ where: { storeId, name: "owner" } });
    if (!role) {
      role = await tx.role.create({
        data: { storeId, name: "owner", isSystem: true, description: "Default store owner role" },
      });
    }
    const permissionKeys = [
      "dashboard.view",
      "pos.access",
      "pos.sell",
      "pos.hold_order",
      "pos.view_recent_invoices",
      "products.view",
      "products.create",
      "products.update",
      "products.delete",
      "categories.view",
      "categories.create",
      "categories.update",
      "categories.delete",
      "inventory.view",
      "inventory.adjust",
      "inventory.add_stock",
      "inventory.remove_stock",
      "inventory.view_movements",
      "inventory.view_alerts",
      "sales.view",
      "invoices.view",
      "invoices.print",
      "invoices.refund",
      "shifts.open",
      "shifts.close",
      "shifts.view",
      "returns.view",
      "returns.create",
      "expenses.view",
      "expenses.create",
      "expenses.update",
      "expenses.delete",
      "reports.view",
      "closing.view",
      "closing.create",
      "customers.view",
      "customers.create",
      "customers.update",
      "customers.delete",
      "debts.view",
      "debts.add",
      "debts.pay",
      "debts.adjust",
      "suppliers.view",
      "suppliers.create",
      "suppliers.update",
      "suppliers.delete",
      "suppliers.pay",
      "suppliers.adjust",
      "purchase_orders.view",
      "purchase_orders.create",
      "purchase_orders.update",
      "purchase_orders.cancel",
      "purchase_orders.receive",
      "users.manage",
      "settings.manage",
      "activity_logs.view",
      "subscription.view",
      "subscription.request_upgrade",
    ];
    for (const key of permissionKeys) {
      const permission = await tx.permission.findUnique({ where: { key } });
      if (!permission) continue;
      await tx.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId: permission.id } },
        update: {},
        create: { roleId: role.id, permissionId: permission.id },
      });
    }
    return role;
  }

  private async syncStoreStatusFromSubscription(storeId: string, status: SubscriptionStatus) {
    const storeStatus = status === "ACTIVE" ? "ACTIVE" : status === "TRIAL" ? "TRIAL" : status === "SUSPENDED" ? "SUSPENDED" : status === "EXPIRED" ? "EXPIRED" : undefined;
    if (!storeStatus) return;
    await this.prisma.store.update({ where: { id: storeId }, data: { status: storeStatus } });
  }

  private serializePlan(plan: Prisma.SubscriptionPlanGetPayload<{ include: { _count: { select: { subscriptions: true } } } }> | Prisma.SubscriptionPlanGetPayload<object>) {
    return {
      ...plan,
      priceMonthly: Number(plan.priceMonthly),
      priceYearly: plan.priceYearly === null ? null : Number(plan.priceYearly),
    };
  }

  private serializeSubscription(subscription: Prisma.SubscriptionGetPayload<{ include: { store: true; plan: true; payments: true } }> | Prisma.SubscriptionGetPayload<{ include: typeof subscriptionWithPlanInclude }> | (Prisma.SubscriptionGetPayload<object> & { plan?: Prisma.SubscriptionPlanGetPayload<object>; store?: Prisma.StoreGetPayload<object>; payments?: Prisma.SubscriptionPaymentGetPayload<object>[] })) {
    return {
      ...subscription,
      amount: Number(subscription.amount),
      plan: subscription.plan ? this.serializePlan(subscription.plan) : undefined,
      payments: subscription.payments?.map((payment) => this.serializePayment(payment)) ?? undefined,
    };
  }

  private serializePayment(payment: Prisma.SubscriptionPaymentGetPayload<{ include: { store: true; subscription: { include: { plan: true } } } }> | Prisma.SubscriptionPaymentGetPayload<object>) {
    return {
      ...payment,
      amount: Number(payment.amount),
      subscription: "subscription" in payment && payment.subscription
        ? { ...payment.subscription, amount: Number(payment.subscription.amount), plan: payment.subscription.plan ? this.serializePlan(payment.subscription.plan) : undefined }
        : undefined,
    };
  }

  private log(user: AuthenticatedUser, storeId: string | null, action: string, metadata: Record<string, unknown>) {
    return this.activityLogs.log({
      storeId,
      userId: user.id,
      action,
      entityType: "PlatformAdmin",
      entityId: storeId ?? user.id,
      metadata: metadata as Prisma.InputJsonObject,
    });
  }
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function addMonths(date: Date, months: number) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

function getPlanAmount(plan: Prisma.SubscriptionPlanGetPayload<object>, billingCycle: BillingCycle) {
  if (billingCycle === BillingCycle.YEARLY) return plan.priceYearly ?? plan.priceMonthly.mul(12);
  if (billingCycle === BillingCycle.MONTHLY) return plan.priceMonthly;
  return new Prisma.Decimal(0);
}
