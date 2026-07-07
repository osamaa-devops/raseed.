import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { InventoryMovementType, Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import type { AuthenticatedUser } from "../../common/utils/auth.types";
import { ActivityLogsService } from "../activity-logs/activity-logs.service";
import { AddStockDto } from "./dto/add-stock.dto";
import { AdjustStockDto } from "./dto/adjust-stock.dto";
import { CreateInventoryTransferDto } from "./dto/create-inventory-transfer.dto";
import { ExpiryAlertsQueryDto } from "./dto/expiry-alerts-query.dto";
import { GetInventoryMovementsQueryDto } from "./dto/get-inventory-movements-query.dto";
import { GetInventoryStocksQueryDto } from "./dto/get-inventory-stocks-query.dto";
import { GetInventoryTransfersQueryDto } from "./dto/get-inventory-transfers-query.dto";
import { RemoveStockDto } from "./dto/remove-stock.dto";

const stockInclude = {
  product: { include: { category: true } },
  branch: true,
} as const;

const movementInclude = {
  product: { include: { category: true } },
  branch: true,
  user: { select: { id: true, name: true, email: true } },
} as const;

const transferInclude = {
  product: { include: { category: true } },
  sourceBranch: true,
  destinationBranch: true,
  user: { select: { id: true, name: true, email: true } },
} as const;

@Injectable()
export class InventoryService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLogs: ActivityLogsService,
  ) {}

  async getStocks(user: AuthenticatedUser, query: GetInventoryStocksQueryDto) {
    const storeId = this.requireStore(user);
    const branchId = await this.resolveBranchId(storeId, user, query.branchId);
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.InventoryStockWhereInput = {
      storeId,
      branchId,
      product: {
        categoryId: query.categoryId || undefined,
        OR: query.search?.trim()
          ? [
              { name: { contains: query.search.trim(), mode: "insensitive" } },
              { barcode: { contains: query.search.trim(), mode: "insensitive" } },
              { sku: { contains: query.search.trim(), mode: "insensitive" } },
            ]
          : undefined,
      },
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.inventoryStock.findMany({
        where,
        include: stockInclude,
        orderBy: { updatedAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.inventoryStock.count({ where }),
    ]);

    const rows = await Promise.all(items.map((stock) => this.serializeStock(stock)));
    const filteredRows = query.status ? rows.filter((row) => row.stockStatus === query.status) : rows;

    return {
      items: filteredRows,
      meta: { page, limit, total: query.status ? filteredRows.length : total, pages: Math.ceil((query.status ? filteredRows.length : total) / limit) },
    };
  }

  async getStock(user: AuthenticatedUser, productId: string, branchId?: string) {
    const storeId = this.requireStore(user);
    const scopedBranchId = await this.resolveBranchId(storeId, user, branchId);
    await this.getScopedProduct(storeId, productId);
    const stock = await this.prisma.inventoryStock.findUnique({
      where: { storeId_branchId_productId: { storeId, branchId: scopedBranchId, productId } },
      include: stockInclude,
    });
    if (!stock) throw new NotFoundException("Inventory stock not found.");
    return this.serializeStock(stock);
  }

  async getMovements(user: AuthenticatedUser, query: GetInventoryMovementsQueryDto) {
    const storeId = this.requireStore(user);
    const branchId = await this.resolveBranchId(storeId, user, query.branchId);
    if (query.productId) await this.getScopedProduct(storeId, query.productId);
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.InventoryMovementWhereInput = {
      storeId,
      branchId,
      productId: query.productId,
      type: query.type,
      createdAt: {
        gte: query.dateFrom ? new Date(query.dateFrom) : undefined,
        lte: query.dateTo ? new Date(query.dateTo) : undefined,
      },
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.inventoryMovement.findMany({
        where,
        include: movementInclude,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.inventoryMovement.count({ where }),
    ]);
    return { items: items.map((movement) => this.serializeMovement(movement)), meta: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async addStock(user: AuthenticatedUser, dto: AddStockDto) {
    const storeId = this.requireStore(user);
    await this.assertBranch(storeId, dto.branchId);
    await this.getScopedProduct(storeId, dto.productId);
    const quantity = new Prisma.Decimal(dto.quantity);

    const stock = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.inventoryStock.upsert({
        where: { storeId_branchId_productId: { storeId, branchId: dto.branchId, productId: dto.productId } },
        update: {},
        create: { storeId, branchId: dto.branchId, productId: dto.productId, quantity: 0 },
      });
      const quantityBefore = existing.quantity;
      const quantityAfter = quantityBefore.plus(quantity);
      const updated = await tx.inventoryStock.update({
        where: { id: existing.id },
        data: { quantity: quantityAfter },
        include: stockInclude,
      });
      if (dto.expiryDate || dto.batchNumber || dto.purchasePrice !== undefined) {
        await tx.inventoryBatch.create({
          data: {
            storeId,
            branchId: dto.branchId,
            productId: dto.productId,
            batchNumber: this.cleanOptional(dto.batchNumber),
            quantity,
            remainingQuantity: quantity,
            purchasePrice: dto.purchasePrice !== undefined ? new Prisma.Decimal(dto.purchasePrice) : undefined,
            expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : undefined,
          },
        });
      }
      await tx.inventoryMovement.create({
        data: {
          storeId,
          branchId: dto.branchId,
          productId: dto.productId,
          userId: user.id,
          type: InventoryMovementType.ADD_STOCK,
          quantity,
          quantityBefore,
          quantityAfter,
          reason: this.cleanOptional(dto.reason),
          notes: this.cleanOptional(dto.notes),
        },
      });
      return updated;
    });
    await this.log(user, dto.branchId, "inventory.stock_added", dto.productId, { quantity: dto.quantity, reason: dto.reason });
    return this.serializeStock(stock);
  }

  async removeStock(user: AuthenticatedUser, dto: RemoveStockDto) {
    const storeId = this.requireStore(user);
    await this.assertBranch(storeId, dto.branchId);
    await this.getScopedProduct(storeId, dto.productId);
    if (![InventoryMovementType.REMOVE_STOCK, InventoryMovementType.DAMAGE, InventoryMovementType.EXPIRED].includes(dto.type)) {
      throw new BadRequestException("Removal type must be REMOVE_STOCK, DAMAGE, or EXPIRED.");
    }
    const quantity = new Prisma.Decimal(dto.quantity);
    const stock = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.inventoryStock.findUnique({
        where: { storeId_branchId_productId: { storeId, branchId: dto.branchId, productId: dto.productId } },
      });
      if (!existing) throw new NotFoundException("Inventory stock not found.");
      if (existing.quantity.lessThan(quantity)) {
        throw new BadRequestException("Insufficient stock quantity.");
      }
      const quantityBefore = existing.quantity;
      const quantityAfter = quantityBefore.minus(quantity);
      const updated = await tx.inventoryStock.update({
        where: { id: existing.id },
        data: { quantity: quantityAfter },
        include: stockInclude,
      });
      await tx.inventoryMovement.create({
        data: {
          storeId,
          branchId: dto.branchId,
          productId: dto.productId,
          userId: user.id,
          type: dto.type,
          quantity,
          quantityBefore,
          quantityAfter,
          reason: dto.reason.trim(),
          notes: this.cleanOptional(dto.notes),
        },
      });
      return updated;
    });
    const action = dto.type === InventoryMovementType.DAMAGE ? "inventory.stock_damaged" : dto.type === InventoryMovementType.EXPIRED ? "inventory.stock_expired" : "inventory.stock_removed";
    await this.log(user, dto.branchId, action, dto.productId, { quantity: dto.quantity, reason: dto.reason });
    return this.serializeStock(stock);
  }

  async adjustStock(user: AuthenticatedUser, dto: AdjustStockDto) {
    const storeId = this.requireStore(user);
    await this.assertBranch(storeId, dto.branchId);
    await this.getScopedProduct(storeId, dto.productId);
    const newQuantity = new Prisma.Decimal(dto.newQuantity);
    const stock = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.inventoryStock.upsert({
        where: { storeId_branchId_productId: { storeId, branchId: dto.branchId, productId: dto.productId } },
        update: {},
        create: { storeId, branchId: dto.branchId, productId: dto.productId, quantity: 0 },
      });
      const quantityBefore = existing.quantity;
      const movementQuantity = newQuantity.minus(quantityBefore).abs();
      const movementType = newQuantity.greaterThanOrEqualTo(quantityBefore) ? InventoryMovementType.ADJUSTMENT_IN : InventoryMovementType.ADJUSTMENT_OUT;
      const updated = await tx.inventoryStock.update({
        where: { id: existing.id },
        data: { quantity: newQuantity },
        include: stockInclude,
      });
      await tx.inventoryMovement.create({
        data: {
          storeId,
          branchId: dto.branchId,
          productId: dto.productId,
          userId: user.id,
          type: movementType,
          quantity: movementQuantity,
          quantityBefore,
          quantityAfter: newQuantity,
          reason: dto.reason.trim(),
          notes: this.cleanOptional(dto.notes),
        },
      });
      return updated;
    });
    await this.log(user, dto.branchId, "inventory.stock_adjusted", dto.productId, { newQuantity: dto.newQuantity, reason: dto.reason });
    return this.serializeStock(stock);
  }

  async getLowStock(user: AuthenticatedUser, query: GetInventoryStocksQueryDto) {
    return this.getStocks(user, { ...query, status: "low_stock" });
  }

  async getExpiryAlerts(user: AuthenticatedUser, query: ExpiryAlertsQueryDto) {
    const storeId = this.requireStore(user);
    const branchId = await this.resolveBranchId(storeId, user, query.branchId);
    const days = query.days ?? 30;
    const until = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
    const batches = await this.prisma.inventoryBatch.findMany({
      where: {
        storeId,
        branchId,
        remainingQuantity: { gt: 0 },
        expiryDate: { not: null, lte: until },
      },
      include: { product: { include: { category: true } }, branch: true },
      orderBy: { expiryDate: "asc" },
    });
    return batches.map((batch) => ({
      ...batch,
      quantity: Number(batch.quantity),
      remainingQuantity: Number(batch.remainingQuantity),
      purchasePrice: batch.purchasePrice === null ? null : Number(batch.purchasePrice),
      daysRemaining: batch.expiryDate ? Math.ceil((batch.expiryDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000)) : null,
    }));
  }

  async getTransfers(user: AuthenticatedUser, query: GetInventoryTransfersQueryDto) {
    const storeId = this.requireStore(user);
    if (query.branchId) await this.assertBranch(storeId, query.branchId);
    if (query.productId) await this.getScopedProduct(storeId, query.productId);
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.InventoryTransferWhereInput = {
      storeId,
      productId: query.productId,
      status: query.status,
      OR: query.branchId ? [{ sourceBranchId: query.branchId }, { destinationBranchId: query.branchId }] : undefined,
      createdAt: query.dateFrom || query.dateTo
        ? {
            gte: query.dateFrom ? new Date(query.dateFrom) : undefined,
            lte: query.dateTo ? new Date(query.dateTo) : undefined,
          }
        : undefined,
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.inventoryTransfer.findMany({
        where,
        include: transferInclude,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.inventoryTransfer.count({ where }),
    ]);

    return { items: items.map((transfer) => this.serializeTransfer(transfer)), meta: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  async transferStock(user: AuthenticatedUser, dto: CreateInventoryTransferDto) {
    const storeId = this.requireStore(user);
    if (dto.sourceBranchId === dto.destinationBranchId) {
      throw new BadRequestException("Source and destination branches must be different.");
    }
    await this.assertBranch(storeId, dto.sourceBranchId);
    await this.assertBranch(storeId, dto.destinationBranchId);
    await this.getScopedProduct(storeId, dto.productId);
    if (dto.variantId) await this.assertVariant(storeId, dto.productId, dto.variantId);
    const quantity = new Prisma.Decimal(dto.quantity);

    const transfer = await this.prisma.$transaction(async (tx) => {
      const sourceStock = await tx.inventoryStock.findUnique({
        where: { storeId_branchId_productId: { storeId, branchId: dto.sourceBranchId, productId: dto.productId } },
      });
      if (!sourceStock) throw new NotFoundException("Source branch stock not found.");
      if (sourceStock.quantity.lessThan(quantity)) {
        throw new BadRequestException("Insufficient stock quantity in source branch.");
      }

      const destinationStock = await tx.inventoryStock.upsert({
        where: { storeId_branchId_productId: { storeId, branchId: dto.destinationBranchId, productId: dto.productId } },
        update: {},
        create: { storeId, branchId: dto.destinationBranchId, productId: dto.productId, quantity: 0 },
      });

      const createdTransfer = await tx.inventoryTransfer.create({
        data: {
          storeId,
          sourceBranchId: dto.sourceBranchId,
          destinationBranchId: dto.destinationBranchId,
          productId: dto.productId,
          variantId: this.cleanOptional(dto.variantId),
          userId: user.id,
          quantity,
          status: "COMPLETED",
          reason: this.cleanOptional(dto.reason),
          notes: this.cleanOptional(dto.notes),
        },
      });

      const sourceBefore = sourceStock.quantity;
      const sourceAfter = sourceBefore.minus(quantity);
      const destinationBefore = destinationStock.quantity;
      const destinationAfter = destinationBefore.plus(quantity);

      await tx.inventoryStock.update({ where: { id: sourceStock.id }, data: { quantity: sourceAfter } });
      await tx.inventoryStock.update({ where: { id: destinationStock.id }, data: { quantity: destinationAfter } });

      await tx.inventoryMovement.create({
        data: {
          storeId,
          branchId: dto.sourceBranchId,
          productId: dto.productId,
          userId: user.id,
          type: InventoryMovementType.TRANSFER_OUT,
          quantity,
          quantityBefore: sourceBefore,
          quantityAfter: sourceAfter,
          reason: this.cleanOptional(dto.reason) ?? "Stock transfer out",
          referenceType: "InventoryTransfer",
          referenceId: createdTransfer.id,
          notes: this.cleanOptional(dto.notes),
        },
      });

      await tx.inventoryMovement.create({
        data: {
          storeId,
          branchId: dto.destinationBranchId,
          productId: dto.productId,
          userId: user.id,
          type: InventoryMovementType.TRANSFER_IN,
          quantity,
          quantityBefore: destinationBefore,
          quantityAfter: destinationAfter,
          reason: this.cleanOptional(dto.reason) ?? "Stock transfer in",
          referenceType: "InventoryTransfer",
          referenceId: createdTransfer.id,
          notes: this.cleanOptional(dto.notes),
        },
      });

      return tx.inventoryTransfer.findUniqueOrThrow({
        where: { id: createdTransfer.id },
        include: transferInclude,
      });
    });

    await this.activityLogs.log({
      storeId,
      branchId: dto.sourceBranchId,
      userId: user.id,
      action: "inventory.stock_transferred",
      entityType: "InventoryTransfer",
      entityId: transfer.id,
      metadata: {
        productId: dto.productId,
        sourceBranchId: dto.sourceBranchId,
        destinationBranchId: dto.destinationBranchId,
        quantity: dto.quantity,
      },
    });

    return this.serializeTransfer(transfer);
  }

  private requireStore(user: AuthenticatedUser) {
    if (user.isSuperAdmin || !user.storeId) {
      throw new ForbiddenException("Inventory operations require a store user context.");
    }
    return user.storeId;
  }

  private async resolveBranchId(storeId: string, user: AuthenticatedUser, requestedBranchId?: string) {
    if (requestedBranchId) {
      await this.assertBranch(storeId, requestedBranchId);
      return requestedBranchId;
    }
    if (user.branchId) {
      await this.assertBranch(storeId, user.branchId);
      return user.branchId;
    }
    const branch = await this.prisma.branch.findFirst({ where: { storeId, OR: [{ isDefault: true }, { isMain: true }] }, orderBy: { createdAt: "asc" } });
    if (!branch) throw new BadRequestException("No active branch found for this store.");
    return branch.id;
  }

  private async assertBranch(storeId: string, branchId: string) {
    const branch = await this.prisma.branch.findFirst({ where: { id: branchId, storeId, status: "ACTIVE" } });
    if (!branch) throw new BadRequestException("Branch does not belong to this store.");
    return branch;
  }

  private async getScopedProduct(storeId: string, productId: string) {
    const product = await this.prisma.product.findFirst({ where: { id: productId, storeId } });
    if (!product) throw new BadRequestException("Product does not belong to this store.");
    return product;
  }

  private async assertVariant(storeId: string, productId: string, variantId: string) {
    const variant = await this.prisma.productVariant.findFirst({ where: { id: variantId, storeId, productId } });
    if (!variant) throw new BadRequestException("Variant does not belong to this product.");
    return variant;
  }

  private async serializeStock(stock: Prisma.InventoryStockGetPayload<{ include: typeof stockInclude }>) {
    const lastMovement = await this.prisma.inventoryMovement.findFirst({
      where: { storeId: stock.storeId, branchId: stock.branchId, productId: stock.productId },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    });
    const quantity = Number(stock.quantity);
    const minStock = stock.minStockOverride === null ? stock.product.minStock : Number(stock.minStockOverride);
    return {
      ...stock,
      quantity,
      minStockOverride: stock.minStockOverride === null ? null : Number(stock.minStockOverride),
      minStock,
      stockStatus: quantity <= 0 ? "out_of_stock" : quantity <= minStock ? "low_stock" : "in_stock",
      lastMovementAt: lastMovement?.createdAt ?? null,
    };
  }

  private serializeMovement(movement: Prisma.InventoryMovementGetPayload<{ include: typeof movementInclude }>) {
    return {
      ...movement,
      quantity: Number(movement.quantity),
      quantityBefore: Number(movement.quantityBefore),
      quantityAfter: Number(movement.quantityAfter),
    };
  }

  private serializeTransfer(transfer: Prisma.InventoryTransferGetPayload<{ include: typeof transferInclude }>) {
    return {
      ...transfer,
      quantity: Number(transfer.quantity),
    };
  }

  private cleanOptional(value?: string | null) {
    const cleaned = value?.trim();
    return cleaned || undefined;
  }

  private log(user: AuthenticatedUser, branchId: string, action: string, entityId: string, metadata: Record<string, unknown>) {
    return this.activityLogs.log({
      storeId: user.storeId,
      branchId,
      userId: user.id,
      action,
      entityType: "InventoryStock",
      entityId,
      metadata: metadata as Prisma.InputJsonObject,
    });
  }
}
