import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InventoryMovementType, Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import type { AuthenticatedUser } from "../../common/utils/auth.types";
import { ActivityLogsService } from "../activity-logs/activity-logs.service";
import { CreateReturnDto } from "./dto/create-return.dto";
import { GetReturnsQueryDto } from "./dto/get-returns-query.dto";

const returnInclude = {
  branch: true,
  cashier: { select: { id: true, name: true, email: true } },
  invoice: { select: { id: true, invoiceNumber: true, status: true, total: true } },
  items: true,
} as const;

const invoiceWithItemsInclude = {
  items: true,
  payments: true,
  returns: true,
} as const;

@Injectable()
export class ReturnsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLogs: ActivityLogsService,
  ) {}

  async list(user: AuthenticatedUser, query: GetReturnsQueryDto) {
    const storeId = this.requireStore(user);
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.ReturnWhereInput = {
      storeId,
      branchId: query.branchId || undefined,
      cashierId: query.cashierId || undefined,
      invoiceId: query.invoiceId || undefined,
      status: query.status,
      createdAt: {
        gte: query.dateFrom ? new Date(query.dateFrom) : undefined,
        lte: query.dateTo ? new Date(query.dateTo) : undefined,
      },
    };
    if (!this.canViewAll(user)) where.cashierId = user.id;
    const [items, total] = await this.prisma.$transaction([
      this.prisma.return.findMany({ where, include: returnInclude, orderBy: { createdAt: "desc" }, skip: (page - 1) * limit, take: limit }),
      this.prisma.return.count({ where }),
    ]);
    return { items: items.map((item) => this.serializeReturn(item)), meta: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async get(user: AuthenticatedUser, id: string) {
    const storeId = this.requireStore(user);
    const returnRecord = await this.prisma.return.findUnique({ where: { id }, include: returnInclude });
    if (!returnRecord || returnRecord.storeId !== storeId) throw new NotFoundException("Return not found.");
    if (!this.canViewAll(user) && returnRecord.cashierId !== user.id) throw new ForbiddenException("Cannot view this return.");
    return this.serializeReturn(returnRecord);
  }

  async getByNumber(user: AuthenticatedUser, returnNumber: string) {
    const storeId = this.requireStore(user);
    const returnRecord = await this.prisma.return.findFirst({ where: { storeId, returnNumber }, include: returnInclude });
    if (!returnRecord) throw new NotFoundException("Return not found.");
    if (!this.canViewAll(user) && returnRecord.cashierId !== user.id) throw new ForbiddenException("Cannot view this return.");
    return this.serializeReturn(returnRecord);
  }

  async create(user: AuthenticatedUser, dto: CreateReturnDto) {
    const storeId = this.requireStore(user);
    if (!user.permissions.includes("returns.create") && !user.permissions.includes("invoices.refund")) {
      throw new ForbiddenException("Missing return permissions.");
    }
    if (user.roleName === "cashier" && user.branchId && dto.branchId !== user.branchId) {
      throw new ForbiddenException("Cashiers can only create returns in their assigned branch.");
    }
    await this.assertBranch(storeId, dto.branchId);
    const invoice = await this.prisma.invoice.findUnique({ where: { id: dto.invoiceId }, include: invoiceWithItemsInclude });
    if (!invoice || invoice.storeId !== storeId || invoice.branchId !== dto.branchId) throw new NotFoundException("Invoice not found.");
    if (!["PAID", "PARTIALLY_REFUNDED"].includes(invoice.status)) throw new BadRequestException("Invoice is not returnable.");
    if (!this.canViewAll(user) && invoice.cashierId !== user.id && !user.permissions.includes("returns.create")) {
      throw new ForbiddenException("Cannot return this invoice.");
    }
    const shiftId = await this.resolveReturnShift(storeId, dto.branchId, user, dto.shiftId);

    if (!this.canViewAll(user)) {
      const originalMethods = Array.from(new Set(invoice.payments.filter((payment) => payment.amount.greaterThan(0)).map((payment) => payment.method)));
      if (originalMethods.length !== 1 || originalMethods[0] !== dto.refundMethod) {
        throw new ForbiddenException("Mixed payments or a different refund method require owner or manager approval.");
      }
    }

    const itemById = new Map(invoice.items.map((item) => [item.id, item]));
    const invoiceLinesTotal = invoice.items.reduce((sum, item) => sum.plus(item.lineTotal), new Prisma.Decimal(0));
    const netRatio = invoiceLinesTotal.greaterThan(0) ? invoice.total.div(invoiceLinesTotal) : new Prisma.Decimal(0);
    let refundTotal = new Prisma.Decimal(0);
    const calculatedItems = dto.items.map((item) => {
      const invoiceItem = itemById.get(item.invoiceItemId);
      if (!invoiceItem) throw new BadRequestException("Return item does not belong to this invoice.");
      const quantity = new Prisma.Decimal(item.quantity);
      const returnable = invoiceItem.quantity.minus(invoiceItem.returnedQuantity);
      if (quantity.greaterThan(returnable)) throw new BadRequestException("Return quantity exceeds remaining returnable quantity.");
      const proportionalRefund = invoiceItem.lineTotal.div(invoiceItem.quantity).mul(quantity).mul(netRatio);
      refundTotal = refundTotal.plus(proportionalRefund);
      return {
        input: item,
        invoiceItem,
        quantity,
        refundAmount: proportionalRefund,
        restocked: item.restocked ?? true,
      };
    });

    const created = await this.prisma.$transaction(async (tx) => {
      const returnNumber = await this.generateReturnNumber(tx, storeId, dto.branchId);
      const returnRecord = await tx.return.create({
        data: {
          storeId,
          branchId: dto.branchId,
          invoiceId: invoice.id,
          cashierId: user.id,
          shiftId,
          returnNumber,
          reason: dto.reason.trim(),
          refundTotal,
          refundMethod: dto.refundMethod,
          notes: dto.notes?.trim(),
        },
      });

      for (const row of calculatedItems) {
        const nextReturnedQuantity = row.invoiceItem.returnedQuantity.plus(row.quantity);
        await tx.returnItem.create({
          data: {
            storeId,
            branchId: dto.branchId,
            returnId: returnRecord.id,
            invoiceItemId: row.invoiceItem.id,
            productId: row.invoiceItem.productId,
            productName: row.invoiceItem.productName,
            productBarcode: row.invoiceItem.productBarcode,
            quantity: row.quantity,
            unitPrice: row.invoiceItem.unitPrice,
            refundAmount: row.refundAmount,
            restocked: row.restocked,
          },
        });
        const updatedItem = await tx.invoiceItem.updateMany({
          where: { id: row.invoiceItem.id, returnedQuantity: row.invoiceItem.returnedQuantity },
          data: { returnedQuantity: nextReturnedQuantity },
        });
        if (updatedItem.count !== 1) {
          throw new BadRequestException("The invoice return quantities changed. Reload the invoice and try again.");
        }
        if (row.restocked) {
          const stock = await tx.inventoryStock.upsert({
            where: { storeId_branchId_productId: { storeId, branchId: dto.branchId, productId: row.invoiceItem.productId } },
            update: {},
            create: { storeId, branchId: dto.branchId, productId: row.invoiceItem.productId, quantity: 0 },
          });
          const quantityAfter = stock.quantity.plus(row.quantity);
          await tx.inventoryStock.update({ where: { id: stock.id }, data: { quantity: quantityAfter } });
          await tx.inventoryMovement.create({
            data: {
              storeId,
              branchId: dto.branchId,
              productId: row.invoiceItem.productId,
              userId: user.id,
              type: InventoryMovementType.RETURN,
              quantity: row.quantity,
              quantityBefore: stock.quantity,
              quantityAfter,
              referenceType: "Return",
              referenceId: returnRecord.id,
              reason: `Return ${returnNumber}`,
            },
          });
          await tx.activityLog.create({
            data: {
              storeId,
              branchId: dto.branchId,
              userId: user.id,
              action: "inventory.stock_returned",
              entityType: "Return",
              entityId: returnRecord.id,
              metadata: { productId: row.invoiceItem.productId, quantity: Number(row.quantity) },
            },
          });
        }
      }

      await tx.payment.create({
        data: {
          storeId,
          branchId: dto.branchId,
          invoiceId: invoice.id,
          method: dto.refundMethod,
          amount: refundTotal.neg(),
        },
      });

      const freshItems = await tx.invoiceItem.findMany({ where: { invoiceId: invoice.id } });
      const fullRefunded = freshItems.every((item) => item.returnedQuantity.greaterThanOrEqualTo(item.quantity));
      const nextStatus = fullRefunded ? "REFUNDED" : "PARTIALLY_REFUNDED";
      await tx.invoice.update({ where: { id: invoice.id }, data: { status: nextStatus } });
      await tx.activityLog.create({
        data: {
          storeId,
          branchId: dto.branchId,
          userId: user.id,
          action: "return.created",
          entityType: "Return",
          entityId: returnRecord.id,
          metadata: { returnNumber, invoiceId: invoice.id, refundTotal: Number(refundTotal) },
        },
      });
      await tx.activityLog.create({
        data: {
          storeId,
          branchId: dto.branchId,
          userId: user.id,
          action: nextStatus === "REFUNDED" ? "invoice.fully_refunded" : "invoice.partially_refunded",
          entityType: "Invoice",
          entityId: invoice.id,
          metadata: { returnId: returnRecord.id, status: nextStatus },
        },
      });
      return tx.return.findUniqueOrThrow({ where: { id: returnRecord.id }, include: returnInclude });
    });

    return this.serializeReturn(created);
  }

  private async generateReturnNumber(tx: Prisma.TransactionClient, storeId: string, branchId: string) {
    const today = new Date();
    const datePart = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}`;
    const count = await tx.return.count({ where: { storeId, branchId, returnNumber: { startsWith: `RET-${datePart}` } } });
    return `RET-${datePart}-${String(count + 1).padStart(5, "0")}`;
  }

  private requireStore(user: AuthenticatedUser) {
    if (user.isSuperAdmin || !user.storeId) throw new ForbiddenException("Returns require a store user context.");
    return user.storeId;
  }

  private async assertBranch(storeId: string, branchId: string) {
    const branch = await this.prisma.branch.findFirst({ where: { id: branchId, storeId, status: "ACTIVE" } });
    if (!branch) throw new BadRequestException("Branch does not belong to this store.");
  }

  private async validateShift(storeId: string, branchId: string, user: AuthenticatedUser, shiftId: string) {
    const shift = await this.prisma.cashierShift.findUnique({ where: { id: shiftId } });
    if (!shift || shift.storeId !== storeId || shift.branchId !== branchId || shift.status !== "OPEN") {
      throw new BadRequestException("Shift is not open for this branch.");
    }
    if (shift.cashierId !== user.id && !this.canViewAll(user)) throw new ForbiddenException("This shift does not belong to the current cashier.");
  }

  private async resolveReturnShift(storeId: string, branchId: string, user: AuthenticatedUser, requestedShiftId?: string) {
    if (requestedShiftId) {
      await this.validateShift(storeId, branchId, user, requestedShiftId);
      return requestedShiftId;
    }
    if (user.roleName !== "cashier") return undefined;
    const shift = await this.prisma.cashierShift.findFirst({
      where: { storeId, branchId, cashierId: user.id, status: "OPEN" },
      orderBy: { openedAt: "desc" },
    });
    if (!shift) throw new BadRequestException("Open a cashier shift before creating a return.");
    return shift.id;
  }

  private canViewAll(user: AuthenticatedUser) {
    return user.roleName === "owner" || user.roleName === "manager" || user.permissions.includes("users.manage");
  }

  private serializeReturn(returnRecord: Prisma.ReturnGetPayload<{ include: typeof returnInclude }>) {
    return {
      ...returnRecord,
      refundTotal: Number(returnRecord.refundTotal),
      invoice: returnRecord.invoice ? { ...returnRecord.invoice, total: Number(returnRecord.invoice.total) } : returnRecord.invoice,
      items: returnRecord.items.map((item) => ({
        ...item,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        refundAmount: Number(item.refundAmount),
      })),
    };
  }
}
