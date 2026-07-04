import { BadRequestException, ForbiddenException, Injectable } from "@nestjs/common";
import { InvoiceStatus, Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import type { AuthenticatedUser } from "../../common/utils/auth.types";
import { ActivityLogsService } from "../activity-logs/activity-logs.service";
import { ReportQueryDto } from "./dto/report-query.dto";

const salesStatuses: InvoiceStatus[] = ["PAID", "PARTIALLY_REFUNDED", "REFUNDED"];

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLogs: ActivityLogsService,
  ) {}

  async dailySales(user: AuthenticatedUser, query: ReportQueryDto) {
    const { storeId, where, range } = await this.scope(user, query);
    const invoices = await this.prisma.invoice.findMany({ where, select: { total: true, createdAt: true } });
    await this.log(user, "report.daily_sales_viewed", query.branchId);
    return { range, rows: groupByDate(invoices.map((invoice) => ({ date: invoice.createdAt, total: Number(invoice.total) }))) };
  }

  async monthlySales(user: AuthenticatedUser, query: ReportQueryDto) {
    const { where, range } = await this.scope(user, query);
    const invoices = await this.prisma.invoice.findMany({ where, select: { total: true, createdAt: true } });
    await this.log(user, "report.monthly_sales_viewed", query.branchId);
    return { range, rows: groupByMonth(invoices.map((invoice) => ({ date: invoice.createdAt, total: Number(invoice.total) }))) };
  }

  async profit(user: AuthenticatedUser, query: ReportQueryDto) {
    const { storeId, range } = await this.scope(user, query);
    const items = await this.prisma.invoiceItem.findMany({
      where: { storeId, branchId: query.branchId || undefined, invoice: { status: { in: salesStatuses }, cashierId: query.cashierId || undefined, createdAt: dateFilter(range) } },
      select: { quantity: true, returnedQuantity: true, unitPrice: true, purchasePriceSnapshot: true, discount: true, lineTotal: true },
    });
    const revenue = items.reduce((sum, item) => sum + Number(item.lineTotal), 0);
    const cost = items.reduce((sum, item) => sum + Number(item.purchasePriceSnapshot ?? 0) * Math.max(Number(item.quantity) - Number(item.returnedQuantity), 0), 0);
    const grossProfitEstimate = items.reduce((sum, item) => {
      const qty = Math.max(Number(item.quantity) - Number(item.returnedQuantity), 0);
      return sum + (Number(item.unitPrice) - Number(item.purchasePriceSnapshot ?? 0)) * qty - Number(item.discount ?? 0);
    }, 0);
    await this.log(user, "report.profit_viewed", query.branchId);
    return { range, revenue: round(revenue), estimatedCost: round(cost), grossProfitEstimate: round(grossProfitEstimate) };
  }

  async paymentMethods(user: AuthenticatedUser, query: ReportQueryDto) {
    const { storeId, range } = await this.scope(user, query);
    const rows = await this.prisma.payment.groupBy({
      by: ["method"],
      where: { storeId, branchId: query.branchId || undefined, invoice: { cashierId: query.cashierId || undefined }, createdAt: dateFilter(range) },
      _sum: { amount: true },
      _count: { id: true },
    });
    await this.log(user, "report.payment_methods_viewed", query.branchId);
    return { range, rows: rows.map((row) => ({ method: row.method, total: Number(row._sum.amount ?? 0), count: row._count.id })) };
  }

  async cashierPerformance(user: AuthenticatedUser, query: ReportQueryDto) {
    const { where, range } = await this.scope(user, query);
    const rows = await this.prisma.invoice.groupBy({
      by: ["cashierId"],
      where,
      _sum: { total: true },
      _count: { id: true },
      orderBy: { _sum: { total: "desc" } },
    });
    const users = await this.prisma.user.findMany({ where: { id: { in: rows.map((row) => row.cashierId) } }, select: { id: true, name: true } });
    const names = new Map(users.map((item) => [item.id, item.name]));
    await this.log(user, "report.cashier_performance_viewed", query.branchId);
    return { range, rows: rows.map((row) => ({ cashierId: row.cashierId, cashierName: names.get(row.cashierId) ?? "غير معروف", invoicesCount: row._count.id, totalSales: Number(row._sum.total ?? 0) })) };
  }

  async productSales(user: AuthenticatedUser, query: ReportQueryDto, direction: "asc" | "desc") {
    const { storeId, range } = await this.scope(user, query);
    const rows = await this.prisma.invoiceItem.groupBy({
      by: ["productId", "productName"],
      where: { storeId, branchId: query.branchId || undefined, invoice: { status: { in: salesStatuses }, cashierId: query.cashierId || undefined, createdAt: dateFilter(range) } },
      _sum: { quantity: true, lineTotal: true },
      orderBy: { _sum: { quantity: direction } },
      take: 10,
    });
    await this.log(user, direction === "desc" ? "report.best_products_viewed" : "report.worst_products_viewed", query.branchId);
    return { range, rows: rows.map((row) => ({ productId: row.productId, productName: row.productName, quantity: Number(row._sum.quantity ?? 0), sales: Number(row._sum.lineTotal ?? 0) })) };
  }

  async worstSellingProducts(user: AuthenticatedUser, query: ReportQueryDto) {
    const sold = await this.productSales(user, query, "asc");
    const { storeId } = await this.scope(user, query);
    const soldIds = new Set(sold.rows.map((row) => row.productId));
    const unsold = await this.prisma.product.findMany({
      where: { storeId, id: { notIn: Array.from(soldIds) }, status: "ACTIVE" },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
      take: Math.max(10 - sold.rows.length, 0),
    });
    return { range: sold.range, rows: [...sold.rows, ...unsold.map((product) => ({ productId: product.id, productName: product.name, quantity: 0, sales: 0 }))] };
  }

  async inventoryValue(user: AuthenticatedUser, query: ReportQueryDto) {
    const { storeId, range } = await this.scope(user, query);
    const stocks = await this.prisma.inventoryStock.findMany({ where: { storeId, branchId: query.branchId || undefined }, include: { product: true, branch: true } });
    const rows = stocks.map((stock) => {
      const quantity = Number(stock.quantity);
      const purchasePrice = Number(stock.product.purchasePrice);
      return { productId: stock.productId, productName: stock.product.name, branchName: stock.branch.name, quantity, purchasePrice, value: round(quantity * purchasePrice) };
    });
    await this.log(user, "report.inventory_value_viewed", query.branchId);
    return { range, totalValue: round(rows.reduce((sum, row) => sum + row.value, 0)), rows };
  }

  async expenses(user: AuthenticatedUser, query: ReportQueryDto) {
    const { storeId, range } = await this.scope(user, query);
    const rows = await this.prisma.expense.groupBy({
      by: ["category"],
      where: { storeId, branchId: query.branchId || undefined, deletedAt: null, expenseDate: dateFilter(range) },
      _sum: { amount: true },
      _count: { id: true },
      orderBy: { _sum: { amount: "desc" } },
    });
    await this.log(user, "report.expenses_viewed", query.branchId);
    return { range, total: round(rows.reduce((sum, row) => sum + Number(row._sum.amount ?? 0), 0)), rows: rows.map((row) => ({ category: row.category, total: Number(row._sum.amount ?? 0), count: row._count.id })) };
  }

  private async scope(user: AuthenticatedUser, query: ReportQueryDto) {
    const storeId = this.requireStore(user);
    if (query.branchId) await this.assertBranch(storeId, query.branchId);
    const range = {
      dateFrom: query.dateFrom ? new Date(query.dateFrom) : new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      dateTo: query.dateTo ? endOfDay(new Date(query.dateTo)) : endOfDay(new Date()),
    };
    return {
      storeId,
      range,
      where: {
        storeId,
        branchId: query.branchId || undefined,
        cashierId: query.cashierId || undefined,
        status: { in: salesStatuses },
        createdAt: dateFilter(range),
      } satisfies Prisma.InvoiceWhereInput,
    };
  }

  private requireStore(user: AuthenticatedUser) {
    if (user.isSuperAdmin || !user.storeId) throw new ForbiddenException("Reports require a store user context.");
    return user.storeId;
  }

  private async assertBranch(storeId: string, branchId: string) {
    const branch = await this.prisma.branch.findFirst({ where: { id: branchId, storeId, status: "ACTIVE" } });
    if (!branch) throw new BadRequestException("Branch does not belong to this store.");
  }

  private log(user: AuthenticatedUser, action: string, branchId?: string) {
    return this.activityLogs.log({ storeId: user.storeId, branchId: branchId ?? user.branchId, userId: user.id, action, entityType: "Report" });
  }
}

function dateFilter(range: { dateFrom: Date; dateTo: Date }): Prisma.DateTimeFilter {
  return { gte: range.dateFrom, lte: range.dateTo };
}

function groupByDate(items: Array<{ date: Date; total: number }>) {
  const map = new Map<string, { date: string; totalSales: number; invoicesCount: number }>();
  for (const item of items) {
    const key = toDateKey(item.date);
    const row = map.get(key) ?? { date: key, totalSales: 0, invoicesCount: 0 };
    row.totalSales += item.total;
    row.invoicesCount += 1;
    map.set(key, row);
  }
  return Array.from(map.values()).map((row) => ({ ...row, totalSales: round(row.totalSales) })).sort((a, b) => a.date.localeCompare(b.date));
}

function groupByMonth(items: Array<{ date: Date; total: number }>) {
  const map = new Map<string, { month: string; totalSales: number; invoicesCount: number }>();
  for (const item of items) {
    const key = `${item.date.getFullYear()}-${String(item.date.getMonth() + 1).padStart(2, "0")}`;
    const row = map.get(key) ?? { month: key, totalSales: 0, invoicesCount: 0 };
    row.totalSales += item.total;
    row.invoicesCount += 1;
    map.set(key, row);
  }
  return Array.from(map.values()).map((row) => ({ ...row, totalSales: round(row.totalSales) })).sort((a, b) => a.month.localeCompare(b.month));
}

function toDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function endOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

function round(value: number) {
  return Number(value.toFixed(2));
}
