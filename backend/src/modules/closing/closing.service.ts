import { BadRequestException, ConflictException, ForbiddenException, Injectable } from "@nestjs/common";
import { InvoiceStatus, Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import type { AuthenticatedUser } from "../../common/utils/auth.types";
import { ActivityLogsService } from "../activity-logs/activity-logs.service";
import { CloseDayDto } from "./dto/close-day.dto";
import { ClosingHistoryQueryDto } from "./dto/closing-history-query.dto";
import { ClosingSummaryQueryDto } from "./dto/closing-summary-query.dto";

const salesStatuses: InvoiceStatus[] = ["PAID", "PARTIALLY_REFUNDED", "REFUNDED"];

@Injectable()
export class ClosingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLogs: ActivityLogsService,
  ) {}

  async summary(user: AuthenticatedUser, query: ClosingSummaryQueryDto) {
    const storeId = this.requireStore(user);
    await this.assertBranch(storeId, query.branchId);
    const date = query.date ? new Date(query.date) : new Date();
    return this.calculateSummary(storeId, query.branchId, date);
  }

  async closeDay(user: AuthenticatedUser, dto: CloseDayDto) {
    const storeId = this.requireStore(user);
    await this.assertBranch(storeId, dto.branchId);
    const date = startOfDay(dto.date ? new Date(dto.date) : new Date());
    const range = dayRange(date);
    const openShifts = await this.prisma.cashierShift.count({ where: { storeId, branchId: dto.branchId, status: "OPEN", openedAt: { lte: range.lte } } });
    if (openShifts > 0) {
      throw new BadRequestException("Cannot close the day while cashier shifts are still open.");
    }
    const existing = await this.prisma.dailyClosing.findUnique({ where: { storeId_branchId_date: { storeId, branchId: dto.branchId, date } } });
    if (existing) throw new ConflictException("This branch is already closed for the selected date.");
    const summary = await this.calculateSummary(storeId, dto.branchId, date);
    const actualCash = new Prisma.Decimal(dto.actualCash);
    const expectedCash = new Prisma.Decimal(summary.expectedCash);
    const closing = await this.prisma.dailyClosing.create({
      data: {
        storeId,
        branchId: dto.branchId,
        closedById: user.id,
        date,
        totalSales: summary.totalSales,
        totalReturns: summary.totalReturns,
        totalExpenses: summary.totalExpenses,
        cashPayments: summary.cashPayments,
        cardPayments: summary.cardPayments,
        walletPayments: summary.walletPayments,
        openingCash: summary.openingCash,
        expectedCash,
        actualCash,
        difference: actualCash.minus(expectedCash),
        netTotal: summary.netTotal,
        notes: dto.notes?.trim(),
      },
      include: { branch: true, closedBy: { select: { id: true, name: true, email: true } } },
    });
    await this.activityLogs.log({
      storeId,
      branchId: dto.branchId,
      userId: user.id,
      action: "closing.day_closed",
      entityType: "DailyClosing",
      entityId: closing.id,
      metadata: { date: toDateKey(date), expectedCash: summary.expectedCash, actualCash: dto.actualCash },
    });
    return this.serializeClosing(closing);
  }

  async history(user: AuthenticatedUser, query: ClosingHistoryQueryDto) {
    const storeId = this.requireStore(user);
    if (query.branchId) await this.assertBranch(storeId, query.branchId);
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.DailyClosingWhereInput = {
      storeId,
      branchId: query.branchId || undefined,
      date: {
        gte: query.dateFrom ? startOfDay(new Date(query.dateFrom)) : undefined,
        lte: query.dateTo ? endOfDay(new Date(query.dateTo)) : undefined,
      },
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.dailyClosing.findMany({ where, include: { branch: true, closedBy: { select: { id: true, name: true, email: true } } }, orderBy: { date: "desc" }, skip: (page - 1) * limit, take: limit }),
      this.prisma.dailyClosing.count({ where }),
    ]);
    return { items: items.map((item) => this.serializeClosing(item)), meta: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  private async calculateSummary(storeId: string, branchId: string, date: Date) {
    const range = dayRange(date);
    const [invoiceAgg, returnsAgg, expenseAgg, payments, shifts, cashierRows, topProducts, lowStockProducts] = await Promise.all([
      this.prisma.invoice.aggregate({ where: { storeId, branchId, status: { in: salesStatuses }, createdAt: range }, _sum: { total: true }, _count: { id: true } }),
      this.prisma.return.aggregate({ where: { storeId, branchId, status: "COMPLETED", createdAt: range }, _sum: { refundTotal: true }, _count: { id: true } }),
      this.prisma.expense.aggregate({ where: { storeId, branchId, deletedAt: null, expenseDate: range }, _sum: { amount: true } }),
      this.prisma.payment.groupBy({ by: ["method"], where: { storeId, branchId, createdAt: range }, _sum: { amount: true } }),
      this.prisma.cashierShift.findMany({ where: { storeId, branchId, openedAt: { lte: range.lte }, OR: [{ closedAt: { gte: range.gte } }, { closedAt: null }] }, include: { cashier: { select: { id: true, name: true } } }, orderBy: { openedAt: "asc" } }),
      this.prisma.invoice.groupBy({ by: ["cashierId"], where: { storeId, branchId, status: { in: salesStatuses }, createdAt: range }, _sum: { total: true }, _count: { id: true } }),
      this.prisma.invoiceItem.groupBy({ by: ["productId", "productName"], where: { storeId, branchId, invoice: { status: { in: salesStatuses }, createdAt: range } }, _sum: { quantity: true, lineTotal: true }, orderBy: { _sum: { quantity: "desc" } }, take: 5 }),
      this.prisma.inventoryStock.findMany({ where: { storeId, branchId }, include: { product: true }, take: 50 }),
    ]);
    const paymentTotals = payments.reduce((totals, row) => ({ ...totals, [row.method]: Number(row._sum.amount ?? 0) }), { CASH: 0, CARD: 0, WALLET: 0 });
    const users = await this.prisma.user.findMany({ where: { id: { in: cashierRows.map((row) => row.cashierId) } }, select: { id: true, name: true } });
    const names = new Map(users.map((item) => [item.id, item.name]));
    const openingCash = shifts.reduce((sum, shift) => sum + Number(shift.openingCash), 0);
    const totalSales = Number(invoiceAgg._sum.total ?? 0);
    const totalReturns = Number(returnsAgg._sum.refundTotal ?? 0);
    const totalExpenses = Number(expenseAgg._sum.amount ?? 0);
    const expectedCash = round(openingCash + paymentTotals.CASH - totalExpenses);
    return {
      date: toDateKey(date),
      branchId,
      totalSales,
      totalReturns,
      totalExpenses,
      cashPayments: round(paymentTotals.CASH),
      cardPayments: round(paymentTotals.CARD),
      walletPayments: round(paymentTotals.WALLET),
      openingCash: round(openingCash),
      expectedCash,
      invoicesCount: invoiceAgg._count.id,
      returnsCount: returnsAgg._count.id,
      netTotal: round(totalSales - totalReturns - totalExpenses),
      shifts: shifts.map((shift) => ({
        id: shift.id,
        cashier: shift.cashier,
        openingCash: Number(shift.openingCash),
        expectedCash: shift.expectedCash ? Number(shift.expectedCash) : null,
        actualCash: shift.actualCash ? Number(shift.actualCash) : null,
        difference: shift.difference ? Number(shift.difference) : null,
        status: shift.status,
        openedAt: shift.openedAt,
        closedAt: shift.closedAt,
      })),
      cashierSummaries: cashierRows.map((row) => ({ cashierId: row.cashierId, cashierName: names.get(row.cashierId) ?? "غير معروف", invoicesCount: row._count.id, totalSales: Number(row._sum.total ?? 0) })),
      bestSellingProducts: topProducts.map((row) => ({ productId: row.productId, productName: row.productName, quantity: Number(row._sum.quantity ?? 0), sales: Number(row._sum.lineTotal ?? 0) })),
      lowStockProducts: lowStockProducts
        .filter((stock) => Number(stock.quantity) <= stock.product.minStock)
        .slice(0, 10)
        .map((stock) => ({ productId: stock.productId, productName: stock.product.name, quantity: Number(stock.quantity), minStock: stock.product.minStock })),
    };
  }

  private requireStore(user: AuthenticatedUser) {
    if (user.isSuperAdmin || !user.storeId) throw new ForbiddenException("Closing requires a store user context.");
    return user.storeId;
  }

  private async assertBranch(storeId: string, branchId: string) {
    const branch = await this.prisma.branch.findFirst({ where: { id: branchId, storeId, status: "ACTIVE" } });
    if (!branch) throw new BadRequestException("Branch does not belong to this store.");
  }

  private serializeClosing(closing: Prisma.DailyClosingGetPayload<{ include: { branch: true; closedBy: { select: { id: true; name: true; email: true } } } }>) {
    return {
      ...closing,
      totalSales: Number(closing.totalSales),
      totalReturns: Number(closing.totalReturns),
      totalExpenses: Number(closing.totalExpenses),
      cashPayments: Number(closing.cashPayments),
      cardPayments: Number(closing.cardPayments),
      walletPayments: Number(closing.walletPayments),
      openingCash: Number(closing.openingCash),
      expectedCash: Number(closing.expectedCash),
      actualCash: Number(closing.actualCash),
      difference: Number(closing.difference),
      netTotal: Number(closing.netTotal),
    };
  }
}

function dayRange(date: Date): Prisma.DateTimeFilter {
  return { gte: startOfDay(date), lte: endOfDay(date) };
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function endOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

function toDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function round(value: number) {
  return Number(value.toFixed(2));
}
