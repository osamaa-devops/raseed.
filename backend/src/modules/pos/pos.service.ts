import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InventoryMovementType, Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import type { AuthenticatedUser } from "../../common/utils/auth.types";
import { ActivityLogsService } from "../activity-logs/activity-logs.service";
import { CreateHeldOrderDto } from "./dto/create-held-order.dto";
import { CreateSaleDto } from "./dto/create-sale.dto";

const invoiceInclude = {
  branch: true,
  cashier: { select: { id: true, name: true, email: true } },
  customer: { select: { id: true, name: true, phone: true } },
  items: { include: { product: { include: { category: true } } } },
  payments: true,
} as const;

@Injectable()
export class PosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLogs: ActivityLogsService,
  ) {}

  async createSale(user: AuthenticatedUser, dto: CreateSaleDto) {
    const storeId = this.requireStore(user);
    await this.assertBranch(storeId, dto.branchId);
    if (dto.customerId) await this.assertCustomer(storeId, dto.customerId);
    const shift = await this.validateShift(user, storeId, dto.branchId, dto.shiftId);
    const productIds = [...new Set(dto.items.map((item) => item.productId))];
    const products = await this.prisma.product.findMany({ where: { storeId, id: { in: productIds }, status: "ACTIVE" } });
    if (products.length !== productIds.length) throw new BadRequestException("One or more products do not belong to this store.");
    const productById = new Map(products.map((product) => [product.id, product]));

    const stockRows = await this.prisma.inventoryStock.findMany({ where: { storeId, branchId: dto.branchId, productId: { in: productIds } } });
    const stockByProductId = new Map(stockRows.map((stock) => [stock.productId, stock]));

    const aggregatedQuantities = new Map<string, Prisma.Decimal>();
    for (const item of dto.items) {
      const current = aggregatedQuantities.get(item.productId) ?? new Prisma.Decimal(0);
      aggregatedQuantities.set(item.productId, current.plus(item.quantity));
    }
    for (const [productId, quantity] of aggregatedQuantities) {
      const stock = stockByProductId.get(productId);
      if (!stock) throw new BadRequestException("Stock does not exist for one or more products in this branch.");
      if (stock.quantity.lessThan(quantity)) throw new BadRequestException("Insufficient stock for one or more products.");
    }

    const invoiceDiscount = new Prisma.Decimal(dto.invoiceDiscount ?? 0);
    const taxTotal = new Prisma.Decimal(dto.taxAmount ?? 0);
    let itemDiscountTotal = new Prisma.Decimal(0);
    let subtotal = new Prisma.Decimal(0);
    const calculatedItems = dto.items.map((item) => {
      const product = productById.get(item.productId)!;
      const quantity = new Prisma.Decimal(item.quantity);
      const unitPrice = new Prisma.Decimal(item.unitPrice ?? product.sellingPrice);
      const discount = new Prisma.Decimal(item.discount ?? 0);
      const gross = unitPrice.mul(quantity);
      if (discount.greaterThan(gross)) throw new BadRequestException("Item discount cannot exceed line total.");
      const lineTotal = gross.minus(discount);
      subtotal = subtotal.plus(gross);
      itemDiscountTotal = itemDiscountTotal.plus(discount);
      return { item, product, quantity, unitPrice, discount, lineTotal };
    });
    const discountTotal = itemDiscountTotal.plus(invoiceDiscount);
    const total = subtotal.minus(discountTotal).plus(taxTotal);
    if (total.lessThan(0)) throw new BadRequestException("Invoice total cannot be negative.");
    const paidAmount = dto.payments.reduce((sum, payment) => sum.plus(payment.amount), new Prisma.Decimal(0));
    if (paidAmount.lessThan(total)) throw new BadRequestException("Payments total must cover invoice total.");
    const changeAmount = paidAmount.minus(total);

    const invoice = await this.prisma.$transaction(async (tx) => {
      const invoiceNumber = await this.generateInvoiceNumber(tx, storeId, dto.branchId);
      const createdInvoice = await tx.invoice.create({
        data: {
          storeId,
          branchId: dto.branchId,
          cashierId: user.id,
          shiftId: shift?.id,
          customerId: dto.customerId,
          invoiceNumber,
          subtotal,
          discountTotal,
          taxTotal,
          total,
          paidAmount,
          changeAmount,
          notes: dto.notes?.trim(),
        },
      });

      for (const row of calculatedItems) {
        const stock = await tx.inventoryStock.findUnique({
          where: { storeId_branchId_productId: { storeId, branchId: dto.branchId, productId: row.product.id } },
        });
        if (!stock || stock.quantity.lessThan(row.quantity)) {
          throw new BadRequestException("Insufficient stock for one or more products.");
        }
        const quantityAfter = stock.quantity.minus(row.quantity);
        await tx.invoiceItem.create({
          data: {
            storeId,
            branchId: dto.branchId,
            invoiceId: createdInvoice.id,
            productId: row.product.id,
            productName: row.product.name,
            productBarcode: row.product.barcode,
            quantity: row.quantity,
            purchasePriceSnapshot: row.product.purchasePrice,
            unitPrice: row.unitPrice,
            discount: row.discount,
            lineTotal: row.lineTotal,
          },
        });
        await tx.inventoryStock.update({ where: { id: stock.id }, data: { quantity: quantityAfter } });
        await tx.inventoryMovement.create({
          data: {
            storeId,
            branchId: dto.branchId,
            productId: row.product.id,
            userId: user.id,
            type: InventoryMovementType.SALE,
            quantity: row.quantity,
            quantityBefore: stock.quantity,
            quantityAfter,
            referenceType: "Invoice",
            referenceId: createdInvoice.id,
            reason: `Sale invoice ${invoiceNumber}`,
          },
        });
      }

      await tx.payment.createMany({
        data: dto.payments.map((payment) => ({
          storeId,
          branchId: dto.branchId,
          invoiceId: createdInvoice.id,
          method: payment.method,
          amount: new Prisma.Decimal(payment.amount),
        })),
      });
      await tx.activityLog.create({
        data: {
          storeId,
          branchId: dto.branchId,
          userId: user.id,
          action: "sale.completed",
          entityType: "Invoice",
          entityId: createdInvoice.id,
          metadata: { invoiceNumber, total: Number(total) },
        },
      });
      await tx.activityLog.create({
        data: {
          storeId,
          branchId: dto.branchId,
          userId: user.id,
          action: "invoice.created",
          entityType: "Invoice",
          entityId: createdInvoice.id,
          metadata: { invoiceNumber },
        },
      });
      if (dto.customerId) {
        await tx.activityLog.create({
          data: {
            storeId,
            branchId: dto.branchId,
            userId: user.id,
            action: "invoice.linked_to_customer",
            entityType: "Invoice",
            entityId: createdInvoice.id,
            metadata: { invoiceNumber, customerId: dto.customerId },
          },
        });
      }
      return tx.invoice.findUniqueOrThrow({ where: { id: createdInvoice.id }, include: invoiceInclude });
    });

    return this.serializeInvoice(invoice);
  }

  async recentInvoices(user: AuthenticatedUser, branchId?: string) {
    const storeId = this.requireStore(user);
    const scopedBranchId = await this.resolveBranchId(storeId, user, branchId);
    const invoices = await this.prisma.invoice.findMany({
      where: { storeId, branchId: scopedBranchId },
      include: invoiceInclude,
      orderBy: { createdAt: "desc" },
      take: 10,
    });
    return invoices.map((invoice) => this.serializeInvoice(invoice));
  }

  async heldOrders(user: AuthenticatedUser, branchId?: string) {
    const storeId = this.requireStore(user);
    const scopedBranchId = await this.resolveBranchId(storeId, user, branchId);
    return this.prisma.heldOrder.findMany({ where: { storeId, branchId: scopedBranchId, cashierId: user.id }, orderBy: { createdAt: "desc" } });
  }

  async createHeldOrder(user: AuthenticatedUser, dto: CreateHeldOrderDto) {
    const storeId = this.requireStore(user);
    await this.assertBranch(storeId, dto.branchId);
    const heldOrder = await this.prisma.heldOrder.create({
      data: {
        storeId,
        branchId: dto.branchId,
        cashierId: user.id,
        data: dto.data as Prisma.InputJsonObject,
        note: dto.note?.trim(),
      },
    });
    await this.log(user, dto.branchId, "held_order.created", heldOrder.id, { note: dto.note });
    return heldOrder;
  }

  async deleteHeldOrder(user: AuthenticatedUser, id: string) {
    const storeId = this.requireStore(user);
    const heldOrder = await this.prisma.heldOrder.findUnique({ where: { id } });
    if (!heldOrder || heldOrder.storeId !== storeId || heldOrder.cashierId !== user.id) throw new NotFoundException("Held order not found.");
    await this.prisma.heldOrder.delete({ where: { id } });
    await this.log(user, heldOrder.branchId, "held_order.deleted", heldOrder.id, {});
    return { success: true };
  }

  private async validateShift(user: AuthenticatedUser, storeId: string, branchId: string, shiftId?: string) {
    if (!shiftId) return null;
    const shift = await this.prisma.cashierShift.findUnique({ where: { id: shiftId } });
    if (!shift || shift.storeId !== storeId || shift.branchId !== branchId || shift.status !== "OPEN") {
      throw new BadRequestException("Shift is not open for this branch.");
    }
    if (shift.cashierId !== user.id && !(user.roleName === "owner" || user.roleName === "manager")) {
      throw new ForbiddenException("This shift does not belong to the current cashier.");
    }
    return shift;
  }

  private async generateInvoiceNumber(tx: Prisma.TransactionClient, storeId: string, branchId: string) {
    const today = new Date();
    const datePart = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}`;
    const count = await tx.invoice.count({ where: { storeId, branchId, invoiceNumber: { startsWith: `INV-${datePart}` } } });
    return `INV-${datePart}-${String(count + 1).padStart(5, "0")}`;
  }

  private requireStore(user: AuthenticatedUser) {
    if (user.isSuperAdmin || !user.storeId) throw new ForbiddenException("POS operations require a store user context.");
    return user.storeId;
  }

  private async resolveBranchId(storeId: string, user: AuthenticatedUser, branchId?: string) {
    if (branchId) {
      await this.assertBranch(storeId, branchId);
      return branchId;
    }
    if (user.branchId) return user.branchId;
    const branch = await this.prisma.branch.findFirst({ where: { storeId, OR: [{ isDefault: true }, { isMain: true }] } });
    if (!branch) throw new BadRequestException("No branch found for this store.");
    return branch.id;
  }

  private async assertBranch(storeId: string, branchId: string) {
    const branch = await this.prisma.branch.findFirst({ where: { id: branchId, storeId, status: "ACTIVE" } });
    if (!branch) throw new BadRequestException("Branch does not belong to this store.");
  }

  private async assertCustomer(storeId: string, customerId: string) {
    const customer = await this.prisma.customer.findFirst({ where: { id: customerId, storeId, status: "ACTIVE", deletedAt: null } });
    if (!customer) throw new BadRequestException("Customer does not belong to this store.");
  }

  private serializeInvoice(invoice: Prisma.InvoiceGetPayload<{ include: typeof invoiceInclude }>) {
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
      })),
      payments: invoice.payments.map((payment) => ({ ...payment, amount: Number(payment.amount) })),
    };
  }

  private log(user: AuthenticatedUser, branchId: string, action: string, entityId: string, metadata: Record<string, unknown>) {
    return this.activityLogs.log({
      storeId: user.storeId,
      branchId,
      userId: user.id,
      action,
      entityType: "HeldOrder",
      entityId,
      metadata: metadata as Prisma.InputJsonObject,
    });
  }
}
