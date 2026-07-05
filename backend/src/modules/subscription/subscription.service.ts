import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { BillingCycle, Prisma, SubscriptionPaymentStatus, SubscriptionPlanStatus, SubscriptionStatus } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import type { AuthenticatedUser } from "../../common/utils/auth.types";

const subscriptionInclude = {
  plan: true,
  payments: { orderBy: { createdAt: "desc" }, take: 20 },
} as const;

@Injectable()
export class SubscriptionService {
  constructor(private readonly prisma: PrismaService) {}

  async me(user: AuthenticatedUser) {
    const storeId = this.requireStore(user);
    const store = await this.prisma.store.findUnique({ where: { id: storeId } });
    if (!store) throw new NotFoundException("Store not found.");
    const subscription = await this.getCurrentSubscriptionByStoreId(storeId);
    const usage = await this.getUsageSummary(storeId);
    const activePlans = await this.prisma.subscriptionPlan.findMany({
      where: { status: SubscriptionPlanStatus.ACTIVE, id: subscription?.planId ? { not: subscription.planId } : undefined },
      orderBy: { priceMonthly: "asc" },
    });

    return {
      store,
      currentPlan: subscription?.plan ? this.serializePlan(subscription.plan) : null,
      subscriptionStatus: subscription?.status ?? null,
      startDate: subscription?.startDate ?? null,
      endDate: subscription?.endDate ?? null,
      trialEndsAt: subscription?.trialEndsAt ?? null,
      billingCycle: subscription?.billingCycle ?? null,
      amount: subscription ? Number(subscription.amount) : 0,
      usage,
      daysRemaining: this.getDaysRemaining(subscription),
      upgradeOptions: activePlans.map((plan) => this.serializePlan(plan)),
      payments: subscription?.payments.map((payment) => this.serializePayment(payment)) ?? [],
    };
  }

  async usage(user: AuthenticatedUser) {
    const storeId = this.requireStore(user);
    return this.getUsageSummary(storeId);
  }

  async getUsageSummary(storeId: string) {
    const [subscription, usersCount, branchesCount, productsCount, invoicesThisMonth] = await Promise.all([
      this.getCurrentSubscriptionByStoreId(storeId),
      this.prisma.user.count({ where: { storeId, status: { not: "DISABLED" } } }),
      this.prisma.branch.count({ where: { storeId, status: "ACTIVE" } }),
      this.prisma.product.count({ where: { storeId } }),
      this.prisma.invoice.count({
        where: {
          storeId,
          createdAt: {
            gte: startOfMonth(new Date()),
            lte: endOfMonth(new Date()),
          },
        },
      }),
    ]);

    return {
      usersCount,
      branchesCount,
      productsCount,
      invoicesThisMonth,
      storage: null,
      limits: subscription?.plan
        ? {
            maxUsers: subscription.plan.maxUsers,
            maxBranches: subscription.plan.maxBranches,
            maxProducts: subscription.plan.maxProducts,
            maxInvoicesPerMonth: subscription.plan.maxInvoicesPerMonth,
          }
        : null,
    };
  }

  async getCurrentSubscriptionByStoreId(storeId: string) {
    return this.prisma.subscription.findFirst({
      where: { storeId },
      include: subscriptionInclude,
      orderBy: [{ endDate: "desc" }, { createdAt: "desc" }],
    });
  }

  private requireStore(user: AuthenticatedUser) {
    if (user.isSuperAdmin || !user.storeId) {
      throw new ForbiddenException("Subscription endpoints require a store user context.");
    }
    return user.storeId;
  }

  private getDaysRemaining(subscription: Prisma.SubscriptionGetPayload<{ include: typeof subscriptionInclude }> | null) {
    if (!subscription) return null;
    const target = subscription.status === SubscriptionStatus.TRIAL ? subscription.trialEndsAt ?? subscription.endDate : subscription.endDate;
    if (!target) return null;
    return Math.ceil((target.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
  }

  private serializePlan(plan: Prisma.SubscriptionPlanGetPayload<object>) {
    return {
      ...plan,
      priceMonthly: Number(plan.priceMonthly),
      priceYearly: plan.priceYearly === null ? null : Number(plan.priceYearly),
    };
  }

  private serializePayment(payment: Prisma.SubscriptionPaymentGetPayload<object>) {
    return {
      ...payment,
      amount: Number(payment.amount),
    };
  }
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1, 0, 0, 0, 0);
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
}
