import { BadRequestException, ForbiddenException, Injectable } from "@nestjs/common";
import { InvoiceStatus, Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import type { AuthenticatedUser } from "../../common/utils/auth.types";
import { ActivityLogsService } from "../activity-logs/activity-logs.service";
import { DashboardOverviewQueryDto } from "./dto/dashboard-overview-query.dto";

const salesStatuses: InvoiceStatus[] = ["PAID", "PARTIALLY_REFUNDED", "REFUNDED"];

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLogs: ActivityLogsService,
  ) {}

  async overview(user: AuthenticatedUser, query: DashboardOverviewQueryDto) {
    const storeId = this.requireStore(user);
    if (query.branchId) await this.assertBranch(storeId, query.branchId);
    const date = query.date ? new Date(query.date) : new Date();
    const range = dayRange(date);
    const previousRange = dayRange(new Date(date.getFullYear(), date.getMonth(), date.getDate() - 1));
    const branchWhere = query.branchId ? { branchId: query.branchId } : {};
    const invoiceWhere: Prisma.InvoiceWhereInput = { storeId, ...branchWhere, status: { in: salesStatuses }, createdAt: range };
    const previousInvoiceWhere: Prisma.InvoiceWhereInput = { storeId, ...branchWhere, status: { in: salesStatuses }, createdAt: previousRange };
    const returnWhere: Prisma.ReturnWhereInput = { storeId, ...branchWhere, status: "COMPLETED", createdAt: range };
    const expenseWhere: Prisma.ExpenseWhereInput = { storeId, ...branchWhere, deletedAt: null, expenseDate: range };

    const [sales, previousSales, returns, expenses, invoicesCount, previousInvoicesCount, payments, topProducts, recentInvoices, cashierPerformance, lowStockCount, expiryAlertsCount] =
      await Promise.all([
        this.sumInvoices(invoiceWhere),
        this.sumInvoices(previousInvoiceWhere),
        this.sumReturns(returnWhere),
        this.sumExpenses(expenseWhere),
        this.prisma.invoice.count({ where: invoiceWhere }),
        this.prisma.invoice.count({ where: previousInvoiceWhere }),
        this.paymentTotals(storeId, query.branchId, range),
        this.topSellingProducts(storeId, query.branchId, range, 5),
        this.recentInvoices(storeId, query.branchId),
        this.cashierPerformance(storeId, query.branchId, range),
        this.lowStockCount(storeId, query.branchId),
        this.expiryAlertsCount(storeId, query.branchId),
      ]);

    const grossProfitEstimate = await this.grossProfit(storeId, query.branchId, range);
    const previousGrossProfit = await this.grossProfit(storeId, query.branchId, previousRange);
    const netSales = sales - returns;
    await this.activityLogs.log({
      storeId,
      branchId: query.branchId ?? user.branchId,
      userId: user.id,
      action: "dashboard.viewed",
      entityType: "Dashboard",
      metadata: { date: toDateKey(date), branchId: query.branchId },
    });

    return {
      date: toDateKey(date),
      todaySales: sales,
      todayReturns: returns,
      todayExpenses: expenses,
      netSales,
      grossProfitEstimate,
      netProfitEstimate: grossProfitEstimate - expenses,
      invoicesCount,
      returnsCount: await this.prisma.return.count({ where: returnWhere }),
      averageInvoiceValue: invoicesCount > 0 ? round(sales / invoicesCount) : 0,
      lowStockCount,
      expiryAlertsCount,
      cashPayments: payments.CASH,
      cardPayments: payments.CARD,
      walletPayments: payments.WALLET,
      topSellingProducts: topProducts,
      recentInvoices,
      cashierPerformance,
      salesChangePercent: percentChange(previousSales, sales),
      profitChangePercent: percentChange(previousGrossProfit, grossProfitEstimate),
      invoicesChangePercent: percentChange(previousInvoicesCount, invoicesCount),
    };
  }

  private async sumInvoices(where: Prisma.InvoiceWhereInput) {
    const result = await this.prisma.invoice.aggregate({ where, _sum: { total: true } });
    return Number(result._sum.total ?? 0);
  }

  private async sumReturns(where: Prisma.ReturnWhereInput) {
    const result = await this.prisma.return.aggregate({ where, _sum: { refundTotal: true } });
    return Number(result._sum.refundTotal ?? 0);
  }

  private async sumExpenses(where: Prisma.ExpenseWhereInput) {
    const result = await this.prisma.expense.aggregate({ where, _sum: { amount: true } });
    return Number(result._sum.amount ?? 0);
  }

  private async paymentTotals(storeId: string, branchId: string | undefined, createdAt: Prisma.DateTimeFilter) {
    const rows = await this.prisma.payment.groupBy({
      by: ["method"],
      where: { storeId, branchId: branchId || undefined, createdAt },
      _sum: { amount: true },
    });
    return rows.reduce(
      (totals, row) => ({ ...totals, [row.method]: Number(row._sum.amount ?? 0) }),
      { CASH: 0, CARD: 0, WALLET: 0 },
    );
  }

  private async grossProfit(storeId: string, branchId: string | undefined, createdAt: Prisma.DateTimeFilter) {
    const items = await this.prisma.invoiceItem.findMany({
      where: { storeId, branchId: branchId || undefined, invoice: { status: { in: salesStatuses }, createdAt } },
      select: { quantity: true, returnedQuantity: true, unitPrice: true, purchasePriceSnapshot: true, discount: true },
    });
    return round(
      items.reduce((sum, item) => {
        const soldQuantity = Math.max(Number(item.quantity) - Number(item.returnedQuantity), 0);
        const unitProfit = Number(item.unitPrice) - Number(item.purchasePriceSnapshot ?? 0);
        return sum + unitProfit * soldQuantity - Number(item.discount ?? 0);
      }, 0),
    );
  }

  private async topSellingProducts(storeId: string, branchId: string | undefined, createdAt: Prisma.DateTimeFilter, take: number) {
    const rows = await this.prisma.invoiceItem.groupBy({
      by: ["productId", "productName"],
      where: { storeId, branchId: branchId || undefined, invoice: { status: { in: salesStatuses }, createdAt } },
      _sum: { quantity: true, lineTotal: true },
      orderBy: { _sum: { quantity: "desc" } },
      take,
    });
    return rows.map((row) => ({ productId: row.productId, productName: row.productName, quantity: Number(row._sum.quantity ?? 0), sales: Number(row._sum.lineTotal ?? 0) }));
  }

  private recentInvoices(storeId: string, branchId?: string) {
    return this.prisma.invoice
      .findMany({
        where: { storeId, branchId: branchId || undefined },
        include: { cashier: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
        take: 6,
      })
      .then((items) => items.map((item) => ({ id: item.id, invoiceNumber: item.invoiceNumber, total: Number(item.total), status: item.status, cashier: item.cashier, createdAt: item.createdAt })));
  }

  private async cashierPerformance(storeId: string, branchId: string | undefined, createdAt: Prisma.DateTimeFilter) {
    const rows = await this.prisma.invoice.groupBy({
      by: ["cashierId"],
      where: { storeId, branchId: branchId || undefined, status: { in: salesStatuses }, createdAt },
      _sum: { total: true },
      _count: { id: true },
      orderBy: { _sum: { total: "desc" } },
    });
    const users = await this.prisma.user.findMany({ where: { id: { in: rows.map((row) => row.cashierId) } }, select: { id: true, name: true } });
    const nameById = new Map(users.map((user) => [user.id, user.name]));
    return rows.map((row) => ({ cashierId: row.cashierId, cashierName: nameById.get(row.cashierId) ?? "غير معروف", invoicesCount: row._count.id, totalSales: Number(row._sum.total ?? 0) }));
  }

  private async lowStockCount(storeId: string, branchId?: string) {
    const stocks = await this.prisma.inventoryStock.findMany({ where: { storeId, branchId: branchId || undefined }, include: { product: true } });
    return stocks.filter((stock) => Number(stock.quantity) <= stock.product.minStock).length;
  }

  private expiryAlertsCount(storeId: string, branchId?: string) {
    const to = new Date();
    to.setDate(to.getDate() + 30);
    return this.prisma.inventoryBatch.count({
      where: { storeId, branchId: branchId || undefined, remainingQuantity: { gt: 0 }, expiryDate: { gte: new Date(), lte: to } },
    });
  }

  private requireStore(user: AuthenticatedUser) {
    if (user.isSuperAdmin || !user.storeId) throw new ForbiddenException("Dashboard requires a store user context.");
    return user.storeId;
  }

  private async assertBranch(storeId: string, branchId: string) {
    const branch = await this.prisma.branch.findFirst({ where: { id: branchId, storeId, status: "ACTIVE" } });
    if (!branch) throw new BadRequestException("Branch does not belong to this store.");
  }
}

function dayRange(date: Date): Prisma.DateTimeFilter {
  return { gte: new Date(date.getFullYear(), date.getMonth(), date.getDate()), lte: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999) };
}

function toDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function percentChange(previous: number, current: number) {
  if (previous === 0) return current === 0 ? 0 : 100;
  return round(((current - previous) / previous) * 100);
}

function round(value: number) {
  return Number(value.toFixed(2));
}
