import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import type { AuthenticatedUser } from "../../common/utils/auth.types";
import { GetInvoicesQueryDto } from "./dto/get-invoices-query.dto";

const invoiceInclude = {
  branch: true,
  cashier: { select: { id: true, name: true, email: true } },
  customer: { select: { id: true, name: true, phone: true } },
  items: { include: { product: { include: { category: true } } } },
  payments: true,
  returns: {
    include: {
      items: true,
      cashier: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  },
} as const;

@Injectable()
export class InvoicesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(user: AuthenticatedUser, query: GetInvoicesQueryDto) {
    const storeId = this.requireStore(user);
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.InvoiceWhereInput = {
      storeId,
      branchId: query.branchId || undefined,
      cashierId: query.cashierId || undefined,
      shiftId: query.shiftId || undefined,
      customerId: query.customerId || undefined,
      status: query.status,
      payments: query.paymentMethod ? { some: { method: query.paymentMethod } } : undefined,
      createdAt: {
        gte: query.dateFrom ? new Date(query.dateFrom) : undefined,
        lte: query.dateTo ? new Date(query.dateTo) : undefined,
      },
    };
    if (!this.canViewAll(user)) where.cashierId = user.id;
    const [items, total] = await this.prisma.$transaction([
      this.prisma.invoice.findMany({ where, include: invoiceInclude, orderBy: { createdAt: "desc" }, skip: (page - 1) * limit, take: limit }),
      this.prisma.invoice.count({ where }),
    ]);
    return { items: items.map((invoice) => this.serialize(invoice)), meta: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async get(user: AuthenticatedUser, id: string) {
    const storeId = this.requireStore(user);
    const invoice = await this.prisma.invoice.findUnique({ where: { id }, include: invoiceInclude });
    if (!invoice || invoice.storeId !== storeId) throw new NotFoundException("Invoice not found.");
    if (!this.canViewAll(user) && invoice.cashierId !== user.id) throw new ForbiddenException("Cannot view this invoice.");
    return this.serialize(invoice);
  }

  async getByNumber(user: AuthenticatedUser, invoiceNumber: string) {
    const storeId = this.requireStore(user);
    const invoice = await this.prisma.invoice.findFirst({ where: { storeId, invoiceNumber }, include: invoiceInclude });
    if (!invoice) throw new NotFoundException("Invoice not found.");
    if (!this.canViewAll(user) && invoice.cashierId !== user.id) throw new ForbiddenException("Cannot view this invoice.");
    return this.serialize(invoice);
  }

  private requireStore(user: AuthenticatedUser) {
    if (user.isSuperAdmin || !user.storeId) throw new ForbiddenException("Invoice access requires a store user context.");
    return user.storeId;
  }

  private canViewAll(user: AuthenticatedUser) {
    return user.roleName === "owner" || user.roleName === "manager" || user.permissions.includes("users.manage");
  }

  private serialize(invoice: Prisma.InvoiceGetPayload<{ include: typeof invoiceInclude }>) {
    return {
      ...invoice,
      subtotal: Number(invoice.subtotal),
      discountTotal: Number(invoice.discountTotal),
      taxTotal: Number(invoice.taxTotal),
      total: Number(invoice.total),
      paidAmount: Number(invoice.paidAmount),
      changeAmount: Number(invoice.changeAmount),
      items: invoice.items.map((item) => ({
        ...item,
        quantity: Number(item.quantity),
        purchasePriceSnapshot: item.purchasePriceSnapshot === null ? null : Number(item.purchasePriceSnapshot),
        unitPrice: Number(item.unitPrice),
        discount: Number(item.discount),
        lineTotal: Number(item.lineTotal),
        returnedQuantity: Number(item.returnedQuantity),
        returnableQuantity: Number(item.quantity.minus(item.returnedQuantity)),
      })),
      payments: invoice.payments.map((payment) => ({ ...payment, amount: Number(payment.amount) })),
      returns: invoice.returns.map((returnRecord) => ({
        ...returnRecord,
        refundTotal: Number(returnRecord.refundTotal),
        items: returnRecord.items.map((item) => ({
          ...item,
          quantity: Number(item.quantity),
          unitPrice: Number(item.unitPrice),
          refundAmount: Number(item.refundAmount),
        })),
      })),
    };
  }
}
