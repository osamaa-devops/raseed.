import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { CatalogStatus, Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import type { AuthenticatedUser } from "../../common/utils/auth.types";
import { ActivityLogsService } from "../activity-logs/activity-logs.service";
import { CreateHeldOrderDto } from "./dto/create-held-order.dto";
import { CreateSaleDto } from "./dto/create-sale.dto";

const invoiceInclude = {
  branch: true,
  cashier: { select: { id: true, name: true, email: true } },
  customer: { select: { id: true, name: true, phone: true } },
  items: {
    include: {
      product: { include: { category: true } },
      variant: { include: { product: { include: { category: true } } } },
    },
  },
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

    const shift = await this.requireOpenShift(user, storeId, dto.branchId, dto.shiftId);
    const variantIds = [...new Set(dto.items.map((item) => item.variantId))];
    const variants = await this.prisma.productVariant.findMany({
      where: {
        storeId,
        id: { in: variantIds },
        status: CatalogStatus.ACTIVE,
        product: { status: CatalogStatus.ACTIVE },
      },
      include: { product: { include: { category: true } } },
    });
    if (variants.length !== variantIds.length) {
      throw new BadRequestException("Product or variant not found.");
    }
    const variantById = new Map(variants.map((variant) => [variant.id, variant]));

    const invoiceDiscount = new Prisma.Decimal(dto.invoiceDiscount ?? 0);
    const taxTotal = new Prisma.Decimal(dto.taxAmount ?? 0);
    let itemDiscountTotal = new Prisma.Decimal(0);
    let subtotal = new Prisma.Decimal(0);

    const calculatedItems = dto.items.map((item) => {
      const variant = variantById.get(item.variantId);
      if (!variant) throw new BadRequestException("Product or variant not found.");
      const quantity = new Prisma.Decimal(item.quantity);
      const unitPrice = new Prisma.Decimal(item.unitPrice ?? variant.discountPrice ?? variant.sellingPrice);
      const discount = new Prisma.Decimal(item.discount ?? 0);
      const gross = unitPrice.mul(quantity);
      if (discount.greaterThan(gross)) throw new BadRequestException("Item discount cannot exceed line total.");
      const lineTotal = gross.minus(discount);
      subtotal = subtotal.plus(gross);
      itemDiscountTotal = itemDiscountTotal.plus(discount);
      return { item, variant, quantity, unitPrice, discount, lineTotal };
    });

    const discountTotal = itemDiscountTotal.plus(invoiceDiscount);
    const total = subtotal.minus(discountTotal).plus(taxTotal);
    if (total.lessThan(0)) throw new BadRequestException("Invoice total cannot be negative.");

    const paymentTotal = dto.payments.reduce((sum, payment) => sum.plus(payment.amount), new Prisma.Decimal(0));
    if (paymentTotal.lessThan(total)) throw new BadRequestException("Payments total must cover invoice total.");
    const changeAmount = paymentTotal.minus(total);

    const invoice = await this.prisma.$transaction(async (tx) => {
      const invoiceNumber = await this.generateInvoiceNumber(tx, storeId, dto.branchId);
      const createdInvoice = await tx.invoice.create({
        data: {
          storeId,
          branchId: dto.branchId,
          cashierId: user.id,
          shiftId: shift.id,
          customerId: dto.customerId,
          invoiceNumber,
          subtotal,
          discountTotal,
          taxTotal,
          total,
          paidAmount: paymentTotal,
          changeAmount,
          notes: dto.notes?.trim(),
        },
      });

      for (const row of calculatedItems) {
        const updateResult = await tx.productVariant.updateMany({
          where: { id: row.variant.id, stockQuantity: { gte: Number(row.quantity) } },
          data: { stockQuantity: { decrement: Number(row.quantity) } },
        });
        if (updateResult.count === 0) {
          throw new BadRequestException(`Insufficient stock for ${row.variant.product.name} ${row.variant.size} ${row.variant.color}.`);
        }
        const updatedVariant = await tx.productVariant.findUniqueOrThrow({ where: { id: row.variant.id } });
        const siblingVariants = await tx.productVariant.findMany({
          where: { storeId, productId: row.variant.productId },
          select: { stockQuantity: true },
        });
        const productStock = siblingVariants.reduce((sum, variant) => sum + variant.stockQuantity, 0);
        await tx.inventoryStock.upsert({
          where: { storeId_branchId_productId: { storeId, branchId: dto.branchId, productId: row.variant.productId } },
          update: { quantity: productStock },
          create: { storeId, branchId: dto.branchId, productId: row.variant.productId, quantity: productStock },
        });
        await tx.invoiceItem.create({
          data: {
            storeId,
            branchId: dto.branchId,
            invoiceId: createdInvoice.id,
            productId: row.variant.productId,
            variantId: row.variant.id,
            productName: row.variant.product.name,
            productBarcode: row.variant.product.barcode,
            variantSku: row.variant.sku,
            variantBarcode: row.variant.barcode,
            variantSize: row.variant.size,
            variantColor: row.variant.color,
            quantity: row.quantity,
            purchasePriceSnapshot: row.variant.costPrice,
            unitPrice: row.unitPrice,
            discount: row.discount,
            lineTotal: row.lineTotal,
          },
        });

        await tx.activityLog.create({
          data: {
            storeId,
            branchId: dto.branchId,
            userId: user.id,
            action: "stock.decreased",
            entityType: "ProductVariant",
            entityId: row.variant.id,
            metadata: {
              invoiceId: createdInvoice.id,
              quantity: Number(row.quantity),
              stockAfter: updatedVariant.stockQuantity,
            },
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
          metadata: { invoiceNumber, total: Number(total), shiftId: shift.id },
        },
      });

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

  async currentShift(user: AuthenticatedUser, branchId?: string) {
    const storeId = this.requireStore(user);
    const scopedBranchId = await this.resolveBranchId(storeId, user, branchId);
    return this.prisma.cashierShift.findFirst({
      where: { storeId, branchId: scopedBranchId, cashierId: user.id, status: "OPEN" },
      orderBy: { openedAt: "desc" },
    });
  }

  private async requireOpenShift(user: AuthenticatedUser, storeId: string, branchId: string, shiftId?: string) {
    if (shiftId) {
      const shift = await this.prisma.cashierShift.findUnique({ where: { id: shiftId } });
      if (!shift || shift.storeId !== storeId || shift.branchId !== branchId || shift.status !== "OPEN") {
        throw new BadRequestException("No open shift found.");
      }
      if (shift.cashierId !== user.id && !(user.roleName === "owner" || user.roleName === "manager")) {
        throw new ForbiddenException("This shift does not belong to the current cashier.");
      }
      return shift;
    }

    const currentShift = await this.prisma.cashierShift.findFirst({
      where: { storeId, branchId, cashierId: user.id, status: "OPEN" },
      orderBy: { openedAt: "desc" },
    });
    if (!currentShift) {
      throw new BadRequestException("يجب فتح شيفت قبل البيع.");
    }
    return currentShift;
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
    const customer = await this.prisma.customer.findFirst({ where: { id: customerId, storeId, deletedAt: null } });
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
        returnedQuantity: Number(item.returnedQuantity),
        returnableQuantity: Number(item.quantity.minus(item.returnedQuantity)),
        variant: item.variant
          ? {
              ...item.variant,
              costPrice: Number(item.variant.costPrice),
              sellingPrice: Number(item.variant.sellingPrice),
              discountPrice: item.variant.discountPrice === null ? null : Number(item.variant.discountPrice),
            }
          : null,
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
      entityType: "Invoice",
      entityId,
      metadata: metadata as Prisma.InputJsonObject,
    });
  }
}
