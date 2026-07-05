import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InventoryMovementType, Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import type { AuthenticatedUser } from "../../common/utils/auth.types";
import { ActivityLogsService } from "../activity-logs/activity-logs.service";
import { CreatePurchaseOrderDto, PurchaseOrderItemDto } from "./dto/create-purchase-order.dto";
import { GetPurchaseOrdersQueryDto } from "./dto/get-purchase-orders-query.dto";
import { ReceivePurchaseOrderDto } from "./dto/receive-purchase-order.dto";
import { UpdatePurchaseOrderStatusDto } from "./dto/update-purchase-order-status.dto";
import { UpdatePurchaseOrderDto } from "./dto/update-purchase-order.dto";

const orderInclude = {
  branch: true,
  supplier: true,
  createdBy: { select: { id: true, name: true, email: true } },
  items: { orderBy: { createdAt: "asc" } },
} as const;

@Injectable()
export class PurchaseOrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLogs: ActivityLogsService,
  ) {}

  async list(user: AuthenticatedUser, query: GetPurchaseOrdersQueryDto) {
    const storeId = this.requireStore(user);
    if (query.branchId) await this.assertBranch(storeId, query.branchId);
    if (query.supplierId) await this.getScopedSupplier(storeId, query.supplierId);
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.PurchaseOrderWhereInput = {
      storeId,
      branchId: query.branchId,
      supplierId: query.supplierId,
      status: query.status,
      orderNumber: query.search?.trim() ? { contains: query.search.trim(), mode: "insensitive" } : undefined,
      createdAt: {
        gte: query.dateFrom ? new Date(query.dateFrom) : undefined,
        lte: query.dateTo ? new Date(query.dateTo) : undefined,
      },
    };
    const [items, total, summary] = await this.prisma.$transaction([
      this.prisma.purchaseOrder.findMany({ where, include: orderInclude, orderBy: { createdAt: "desc" }, skip: (page - 1) * limit, take: limit }),
      this.prisma.purchaseOrder.count({ where }),
      this.prisma.purchaseOrder.aggregate({ where: { storeId }, _sum: { total: true, paidAmount: true, remainingAmount: true } }),
    ]);
    return {
      items: items.map((item) => this.serializeOrder(item)),
      meta: { page, limit, total, pages: Math.ceil(total / limit) },
      summary: {
        total: Number(summary._sum.total ?? 0),
        paidAmount: Number(summary._sum.paidAmount ?? 0),
        remainingAmount: Number(summary._sum.remainingAmount ?? 0),
      },
    };
  }

  async get(user: AuthenticatedUser, id: string) {
    return this.serializeOrder(await this.getScopedOrder(user, id));
  }

  async create(user: AuthenticatedUser, dto: CreatePurchaseOrderDto) {
    const storeId = this.requireStore(user);
    await this.assertBranch(storeId, dto.branchId);
    await this.getScopedSupplier(storeId, dto.supplierId);
    const prepared = await this.prepareItems(storeId, dto.branchId, dto.items);
    const totals = this.calculateTotals(prepared, dto.discountTotal, dto.taxTotal);
    const orderNumber = await this.generateOrderNumber(storeId, dto.branchId);
    const order = await this.prisma.purchaseOrder.create({
      data: {
        storeId,
        branchId: dto.branchId,
        supplierId: dto.supplierId,
        createdById: user.id,
        orderNumber,
        status: "DRAFT",
        subtotal: totals.subtotal,
        discountTotal: totals.discountTotal,
        taxTotal: totals.taxTotal,
        total: totals.total,
        remainingAmount: totals.total,
        expectedDeliveryDate: dto.expectedDeliveryDate ? new Date(dto.expectedDeliveryDate) : undefined,
        notes: cleanNullable(dto.notes),
        items: { create: prepared.map((item) => item.data) },
      },
      include: orderInclude,
    });
    await this.log(user, dto.branchId, "purchase_order.created", order.id, { orderNumber, total: Number(totals.total), supplierId: dto.supplierId });
    return this.serializeOrder(order);
  }

  async update(user: AuthenticatedUser, id: string, dto: UpdatePurchaseOrderDto) {
    const existing = await this.getScopedOrder(user, id);
    if (!["DRAFT", "SENT"].includes(existing.status)) throw new BadRequestException("Only draft or sent purchase orders can be edited.");
    const branchId = dto.branchId ?? existing.branchId;
    const supplierId = dto.supplierId ?? existing.supplierId;
    await this.assertBranch(existing.storeId, branchId);
    await this.getScopedSupplier(existing.storeId, supplierId);
    const prepared = dto.items ? await this.prepareItems(existing.storeId, branchId, dto.items) : null;
    const shouldRecalculateTotals = Boolean(prepared) || dto.discountTotal !== undefined || dto.taxTotal !== undefined;
    const totalItems = prepared ?? existing.items.map((item) => ({ lineTotal: item.lineTotal }));
    const totals = shouldRecalculateTotals ? this.calculateTotals(totalItems, dto.discountTotal ?? Number(existing.discountTotal), dto.taxTotal ?? Number(existing.taxTotal)) : null;
    if (totals && totals.total.lessThan(existing.paidAmount)) throw new BadRequestException("Purchase order total cannot be less than paid amount.");
    const order = await this.prisma.$transaction(async (tx) => {
      if (prepared) {
        await tx.purchaseOrderItem.deleteMany({ where: { purchaseOrderId: existing.id } });
      } else if (branchId !== existing.branchId) {
        await tx.purchaseOrderItem.updateMany({ where: { purchaseOrderId: existing.id }, data: { branchId } });
      }
      return tx.purchaseOrder.update({
        where: { id: existing.id },
        data: {
          branchId,
          supplierId,
          subtotal: totals?.subtotal,
          discountTotal: totals?.discountTotal ?? (dto.discountTotal !== undefined ? new Prisma.Decimal(dto.discountTotal) : undefined),
          taxTotal: totals?.taxTotal ?? (dto.taxTotal !== undefined ? new Prisma.Decimal(dto.taxTotal) : undefined),
          total: totals?.total,
          remainingAmount: totals ? totals.total.minus(existing.paidAmount) : undefined,
          expectedDeliveryDate: dto.expectedDeliveryDate === null ? null : dto.expectedDeliveryDate ? new Date(dto.expectedDeliveryDate) : undefined,
          notes: dto.notes === null ? null : cleanNullable(dto.notes),
          items: prepared ? { create: prepared.map((item) => item.data) } : undefined,
        },
        include: orderInclude,
      });
    });
    await this.log(user, branchId, "purchase_order.updated", order.id, { orderNumber: order.orderNumber, total: Number(order.total) });
    return this.serializeOrder(order);
  }

  async updateStatus(user: AuthenticatedUser, id: string, dto: UpdatePurchaseOrderStatusDto) {
    const order = await this.getScopedOrder(user, id);
    const allowed = (order.status === "DRAFT" && ["SENT", "CANCELLED"].includes(dto.status)) || (order.status === "SENT" && dto.status === "CANCELLED");
    if (!allowed) throw new BadRequestException("Invalid purchase order status transition.");
    const updated = await this.prisma.purchaseOrder.update({ where: { id: order.id }, data: { status: dto.status }, include: orderInclude });
    await this.log(user, order.branchId, dto.status === "SENT" ? "purchase_order.sent" : "purchase_order.cancelled", order.id, { orderNumber: order.orderNumber });
    return this.serializeOrder(updated);
  }

  async delete(user: AuthenticatedUser, id: string) {
    const order = await this.getScopedOrder(user, id);
    if (order.status !== "DRAFT") throw new BadRequestException("Only draft purchase orders can be cancelled.");
    await this.prisma.purchaseOrder.update({ where: { id: order.id }, data: { status: "CANCELLED" } });
    await this.log(user, order.branchId, "purchase_order.cancelled", order.id, { orderNumber: order.orderNumber });
    return { success: true };
  }

  async receive(user: AuthenticatedUser, id: string, dto: ReceivePurchaseOrderDto) {
    const order = await this.getScopedOrder(user, id);
    if (!["SENT", "PARTIALLY_RECEIVED"].includes(order.status)) throw new BadRequestException("Only sent or partially received purchase orders can be received.");
    const receivedItems = this.mergeReceiveItems(dto.items);
    const itemById = new Map(order.items.map((item) => [item.id, item]));
    let receivedValue = new Prisma.Decimal(0);
    for (const item of receivedItems) {
      const orderItem = itemById.get(item.purchaseOrderItemId);
      if (!orderItem) throw new BadRequestException("Received item does not belong to this purchase order.");
      const quantity = new Prisma.Decimal(item.receivedQuantity);
      const remainingQuantity = orderItem.quantity.minus(orderItem.receivedQuantity);
      if (quantity.greaterThan(remainingQuantity)) throw new BadRequestException("Received quantity cannot exceed remaining ordered quantity.");
      receivedValue = receivedValue.plus(quantity.mul(orderItem.purchasePrice));
    }
    const paidAmount = new Prisma.Decimal(dto.paidAmount ?? 0);
    if (paidAmount.greaterThan(receivedValue)) throw new BadRequestException("Paid amount cannot exceed newly received value.");
    const unpaidAmount = receivedValue.minus(paidAmount);

    const updated = await this.prisma.$transaction(async (tx) => {
      const changedItems: typeof order.items = [];
      for (const item of receivedItems) {
        const orderItem = itemById.get(item.purchaseOrderItemId)!;
        const quantity = new Prisma.Decimal(item.receivedQuantity);
        const updatedItem = await tx.purchaseOrderItem.update({
          where: { id: orderItem.id },
          data: {
            receivedQuantity: orderItem.receivedQuantity.plus(quantity),
            expiryDate: item.expiryDate ? new Date(item.expiryDate) : undefined,
            batchNumber: cleanNullable(item.batchNumber),
          },
        });
        changedItems.push(updatedItem);
        const existingStock = await tx.inventoryStock.upsert({
          where: { storeId_branchId_productId: { storeId: order.storeId, branchId: order.branchId, productId: orderItem.productId } },
          update: {},
          create: { storeId: order.storeId, branchId: order.branchId, productId: orderItem.productId, quantity: 0 },
        });
        const quantityBefore = existingStock.quantity;
        const quantityAfter = quantityBefore.plus(quantity);
        await tx.inventoryStock.update({ where: { id: existingStock.id }, data: { quantity: quantityAfter } });
        await tx.inventoryMovement.create({
          data: {
            storeId: order.storeId,
            branchId: order.branchId,
            productId: orderItem.productId,
            userId: user.id,
            type: InventoryMovementType.PURCHASE,
            quantity,
            quantityBefore,
            quantityAfter,
            reason: "Purchase order received",
            referenceType: "PurchaseOrder",
            referenceId: order.id,
            notes: cleanNullable(dto.notes),
          },
        });
        const expiryDate = item.expiryDate ?? orderItem.expiryDate?.toISOString();
        const batchNumber = cleanNullable(item.batchNumber) ?? orderItem.batchNumber;
        if (expiryDate || batchNumber) {
          await tx.inventoryBatch.create({
            data: {
              storeId: order.storeId,
              branchId: order.branchId,
              productId: orderItem.productId,
              batchNumber,
              quantity,
              remainingQuantity: quantity,
              purchasePrice: orderItem.purchasePrice,
              expiryDate: expiryDate ? new Date(expiryDate) : undefined,
            },
          });
        }
        await tx.activityLog.create({
          data: {
            storeId: order.storeId,
            branchId: order.branchId,
            userId: user.id,
            action: "inventory.stock_added_from_purchase_order",
            entityType: "InventoryStock",
            entityId: orderItem.productId,
            metadata: { purchaseOrderId: order.id, orderNumber: order.orderNumber, quantity: Number(quantity) },
          },
        });
      }

      const allItems = order.items.map((item) => changedItems.find((changed) => changed.id === item.id) ?? item);
      const isFullyReceived = allItems.every((item) => item.receivedQuantity.greaterThanOrEqualTo(item.quantity));
      const newPaidAmount = order.paidAmount.plus(paidAmount);
      const newRemainingAmount = order.total.minus(newPaidAmount);
      const receivedOrder = await tx.purchaseOrder.update({
        where: { id: order.id },
        data: {
          status: isFullyReceived ? "RECEIVED" : "PARTIALLY_RECEIVED",
          paidAmount: newPaidAmount,
          remainingAmount: newRemainingAmount.lessThan(0) ? new Prisma.Decimal(0) : newRemainingAmount,
          receivedAt: isFullyReceived ? new Date() : order.receivedAt,
        },
        include: orderInclude,
      });

      if (unpaidAmount.greaterThan(0)) {
        const supplier = await tx.supplier.findUniqueOrThrow({ where: { id: order.supplierId } });
        const balanceBefore = supplier.currentBalance;
        const balanceAfter = balanceBefore.plus(unpaidAmount);
        await tx.supplier.update({ where: { id: supplier.id }, data: { currentBalance: balanceAfter } });
        await tx.supplierTransaction.create({
          data: {
            storeId: order.storeId,
            branchId: order.branchId,
            supplierId: supplier.id,
            purchaseOrderId: order.id,
            userId: user.id,
            type: "PURCHASE_ORDER_RECEIVED",
            amount: unpaidAmount,
            balanceBefore,
            balanceAfter,
            paymentMethod: dto.paymentMethod,
            reason: "Purchase order received",
            notes: cleanNullable(dto.notes),
          },
        });
      }

      await tx.activityLog.create({
        data: {
          storeId: order.storeId,
          branchId: order.branchId,
          userId: user.id,
          action: "purchase_order.received",
          entityType: "PurchaseOrder",
          entityId: order.id,
          metadata: {
            orderNumber: order.orderNumber,
            receivedValue: Number(receivedValue),
            paidAmount: Number(paidAmount),
            unpaidAmount: Number(unpaidAmount),
            status: receivedOrder.status,
          },
        },
      });
      return receivedOrder;
    });
    return this.serializeOrder(updated);
  }

  private requireStore(user: AuthenticatedUser) {
    if (user.isSuperAdmin || !user.storeId) throw new ForbiddenException("Purchase orders require a store user context.");
    return user.storeId;
  }

  private async getScopedOrder(user: AuthenticatedUser, id: string) {
    const storeId = this.requireStore(user);
    const order = await this.prisma.purchaseOrder.findFirst({ where: { id, storeId }, include: orderInclude });
    if (!order) throw new NotFoundException("Purchase order not found.");
    return order;
  }

  private async assertBranch(storeId: string, branchId: string) {
    const branch = await this.prisma.branch.findFirst({ where: { id: branchId, storeId, status: "ACTIVE" } });
    if (!branch) throw new BadRequestException("Branch does not belong to this store.");
  }

  private async getScopedSupplier(storeId: string, supplierId: string) {
    const supplier = await this.prisma.supplier.findFirst({ where: { id: supplierId, storeId, deletedAt: null } });
    if (!supplier) throw new BadRequestException("Supplier does not belong to this store.");
    return supplier;
  }

  private async prepareItems(storeId: string, branchId: string, items: PurchaseOrderItemDto[]) {
    const productIds = [...new Set(items.map((item) => item.productId))];
    const products = await this.prisma.product.findMany({ where: { storeId, id: { in: productIds } } });
    if (products.length !== productIds.length) throw new BadRequestException("One or more products do not belong to this store.");
    const productById = new Map(products.map((product) => [product.id, product]));
    return items.map((item) => {
      const product = productById.get(item.productId)!;
      const quantity = new Prisma.Decimal(item.quantity);
      const purchasePrice = new Prisma.Decimal(item.purchasePrice);
      const lineTotal = quantity.mul(purchasePrice);
      return {
        data: {
          storeId,
          branchId,
          productId: product.id,
          productName: product.name,
          productBarcode: product.barcode,
          quantity,
          purchasePrice,
          lineTotal,
          expiryDate: item.expiryDate ? new Date(item.expiryDate) : undefined,
          batchNumber: cleanNullable(item.batchNumber),
        },
        lineTotal,
      };
    });
  }

  private calculateTotals(items: { lineTotal: Prisma.Decimal }[], discountTotal = 0, taxTotal = 0) {
    const subtotal = items.reduce((sum, item) => sum.plus(item.lineTotal), new Prisma.Decimal(0));
    const discount = new Prisma.Decimal(discountTotal);
    const tax = new Prisma.Decimal(taxTotal);
    const total = subtotal.minus(discount).plus(tax);
    if (total.lessThan(0)) throw new BadRequestException("Purchase order total cannot be negative.");
    return { subtotal, discountTotal: discount, taxTotal: tax, total };
  }

  private async generateOrderNumber(storeId: string, branchId: string) {
    const count = await this.prisma.purchaseOrder.count({ where: { storeId, branchId } });
    return `PO-${new Date().getFullYear()}-${String(count + 1).padStart(5, "0")}`;
  }

  private mergeReceiveItems(items: ReceivePurchaseOrderDto["items"]) {
    const merged = new Map<string, ReceivePurchaseOrderDto["items"][number]>();
    for (const item of items) {
      const existing = merged.get(item.purchaseOrderItemId);
      if (!existing) {
        merged.set(item.purchaseOrderItemId, item);
      } else {
        existing.receivedQuantity += item.receivedQuantity;
        existing.expiryDate ??= item.expiryDate;
        existing.batchNumber ??= item.batchNumber;
      }
    }
    return [...merged.values()];
  }

  private serializeOrder(order: Prisma.PurchaseOrderGetPayload<{ include: typeof orderInclude }>) {
    return {
      ...order,
      subtotal: Number(order.subtotal),
      discountTotal: Number(order.discountTotal),
      taxTotal: Number(order.taxTotal),
      total: Number(order.total),
      paidAmount: Number(order.paidAmount),
      remainingAmount: Number(order.remainingAmount),
      supplier: { ...order.supplier, currentBalance: Number(order.supplier.currentBalance) },
      items: order.items.map((item) => ({
        ...item,
        quantity: Number(item.quantity),
        receivedQuantity: Number(item.receivedQuantity),
        purchasePrice: Number(item.purchasePrice),
        lineTotal: Number(item.lineTotal),
      })),
    };
  }

  private log(user: AuthenticatedUser, branchId: string, action: string, entityId: string, metadata: Record<string, unknown>) {
    return this.activityLogs.log({
      storeId: user.storeId,
      branchId,
      userId: user.id,
      action,
      entityType: "PurchaseOrder",
      entityId,
      metadata: metadata as Prisma.InputJsonObject,
    });
  }
}

function cleanNullable(value?: string | null) {
  const cleaned = value?.trim();
  return cleaned ? cleaned : value === null ? null : undefined;
}
