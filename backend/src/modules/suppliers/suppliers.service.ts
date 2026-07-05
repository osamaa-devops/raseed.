import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, SupplierTransactionType } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import type { AuthenticatedUser } from "../../common/utils/auth.types";
import { ActivityLogsService } from "../activity-logs/activity-logs.service";
import { CreateSupplierDto } from "./dto/create-supplier.dto";
import { GetSuppliersQueryDto } from "./dto/get-suppliers-query.dto";
import { GetSupplierTransactionsQueryDto, SupplierAdjustDto, SupplierPaymentDto } from "./dto/supplier-transaction.dto";
import { UpdateSupplierStatusDto } from "./dto/update-supplier-status.dto";
import { UpdateSupplierDto } from "./dto/update-supplier.dto";

const supplierInclude = {
  _count: { select: { transactions: true, purchaseOrders: true } },
} as const;

const transactionInclude = {
  branch: true,
  user: { select: { id: true, name: true, email: true } },
  purchaseOrder: { select: { id: true, orderNumber: true, status: true, total: true } },
} as const;

@Injectable()
export class SuppliersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLogs: ActivityLogsService,
  ) {}

  async list(user: AuthenticatedUser, query: GetSuppliersQueryDto) {
    const storeId = this.requireStore(user);
    const search = query.search?.trim();
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.SupplierWhereInput = {
      storeId,
      status: query.status,
      deletedAt: null,
      currentBalance: query.hasBalance === "true" ? { gt: 0 } : query.hasBalance === "false" ? { equals: 0 } : undefined,
      OR: search
        ? [
            { name: { contains: search, mode: "insensitive" } },
            { phone: { contains: search, mode: "insensitive" } },
            { contactPerson: { contains: search, mode: "insensitive" } },
          ]
        : undefined,
    };
    const [items, total, balanceSummary] = await Promise.all([
      this.prisma.supplier.findMany({ where, include: supplierInclude, orderBy: { updatedAt: "desc" }, skip: (page - 1) * limit, take: limit }),
      this.prisma.supplier.count({ where }),
      this.prisma.supplier.aggregate({ where: { storeId, deletedAt: null }, _sum: { currentBalance: true }, _count: { id: true } }),
    ]);
    return {
      items: items.map((item) => this.serializeSupplier(item)),
      meta: { page, limit, total, pages: Math.ceil(total / limit) },
      summary: { totalBalance: Number(balanceSummary._sum.currentBalance ?? 0), suppliersCount: balanceSummary._count.id },
    };
  }

  async get(user: AuthenticatedUser, id: string) {
    return this.serializeSupplier(await this.getScopedSupplier(user, id));
  }

  async create(user: AuthenticatedUser, dto: CreateSupplierDto) {
    const storeId = this.requireStore(user);
    const phone = cleanNullable(dto.phone);
    if (phone) await this.ensureUniquePhone(storeId, phone);
    const supplier = await this.prisma.supplier.create({
      data: {
        storeId,
        name: dto.name.trim(),
        phone,
        email: cleanNullable(dto.email),
        address: cleanNullable(dto.address),
        contactPerson: cleanNullable(dto.contactPerson),
        notes: cleanNullable(dto.notes),
      },
      include: supplierInclude,
    });
    await this.log(user, "supplier.created", supplier.id, { name: supplier.name, phone: supplier.phone });
    return this.serializeSupplier(supplier);
  }

  async update(user: AuthenticatedUser, id: string, dto: UpdateSupplierDto) {
    const existing = await this.getScopedSupplier(user, id);
    const phone = dto.phone === null ? null : cleanNullable(dto.phone);
    if (phone && phone !== existing.phone) await this.ensureUniquePhone(existing.storeId, phone, id);
    const supplier = await this.prisma.supplier.update({
      where: { id },
      data: {
        name: dto.name?.trim(),
        phone,
        email: dto.email === null ? null : cleanNullable(dto.email),
        address: dto.address === null ? null : cleanNullable(dto.address),
        contactPerson: dto.contactPerson === null ? null : cleanNullable(dto.contactPerson),
        notes: dto.notes === null ? null : cleanNullable(dto.notes),
      },
      include: supplierInclude,
    });
    await this.log(user, "supplier.updated", supplier.id, { name: supplier.name, phone: supplier.phone });
    return this.serializeSupplier(supplier);
  }

  async updateStatus(user: AuthenticatedUser, id: string, dto: UpdateSupplierStatusDto) {
    await this.getScopedSupplier(user, id);
    const supplier = await this.prisma.supplier.update({ where: { id }, data: { status: dto.status }, include: supplierInclude });
    await this.log(user, "supplier.status_changed", supplier.id, { status: supplier.status });
    return this.serializeSupplier(supplier);
  }

  async delete(user: AuthenticatedUser, id: string) {
    const supplier = await this.getScopedSupplier(user, id);
    await this.prisma.supplier.update({ where: { id }, data: { deletedAt: new Date(), status: "INACTIVE" } });
    await this.log(user, "supplier.deleted", id, { name: supplier.name, phone: supplier.phone });
    return { success: true };
  }

  async transactions(user: AuthenticatedUser, id: string, query: GetSupplierTransactionsQueryDto) {
    const supplier = await this.getScopedSupplier(user, id);
    if (query.branchId) await this.assertBranch(supplier.storeId, query.branchId);
    const items = await this.prisma.supplierTransaction.findMany({
      where: { storeId: supplier.storeId, supplierId: supplier.id, branchId: query.branchId || undefined },
      include: transactionInclude,
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return { items: items.map((item) => this.serializeTransaction(item)) };
  }

  async payment(user: AuthenticatedUser, id: string, dto: SupplierPaymentDto) {
    const supplier = await this.getScopedSupplier(user, id);
    if (dto.branchId) await this.assertBranch(supplier.storeId, dto.branchId);
    const amount = new Prisma.Decimal(dto.amount);
    const transaction = await this.prisma.$transaction(async (tx) => {
      const current = await tx.supplier.findUniqueOrThrow({ where: { id: supplier.id } });
      if (amount.greaterThan(current.currentBalance)) throw new BadRequestException("Supplier payment cannot exceed current balance.");
      const balanceBefore = current.currentBalance;
      const balanceAfter = balanceBefore.minus(amount);
      await tx.supplier.update({ where: { id: supplier.id }, data: { currentBalance: balanceAfter } });
      const created = await tx.supplierTransaction.create({
        data: {
          storeId: supplier.storeId,
          branchId: dto.branchId,
          supplierId: supplier.id,
          userId: user.id,
          type: "PAYMENT_MADE",
          amount,
          balanceBefore,
          balanceAfter,
          paymentMethod: dto.paymentMethod,
          reason: "Supplier payment",
          notes: cleanNullable(dto.notes),
        },
        include: transactionInclude,
      });
      await tx.activityLog.create({
        data: {
          storeId: supplier.storeId,
          branchId: dto.branchId,
          userId: user.id,
          action: "supplier.payment_made",
          entityType: "Supplier",
          entityId: supplier.id,
          metadata: { amount: Number(amount), paymentMethod: dto.paymentMethod, balanceAfter: Number(balanceAfter) },
        },
      });
      return created;
    });
    return this.serializeTransaction(transaction);
  }

  async adjust(user: AuthenticatedUser, id: string, dto: SupplierAdjustDto) {
    const supplier = await this.getScopedSupplier(user, id);
    if (dto.branchId) await this.assertBranch(supplier.storeId, dto.branchId);
    const amount = new Prisma.Decimal(dto.amount);
    const type: SupplierTransactionType = dto.direction === "IN" ? "ADJUSTMENT_IN" : "ADJUSTMENT_OUT";
    const transaction = await this.prisma.$transaction(async (tx) => {
      const current = await tx.supplier.findUniqueOrThrow({ where: { id: supplier.id } });
      const balanceBefore = current.currentBalance;
      const balanceAfter = dto.direction === "IN" ? balanceBefore.plus(amount) : balanceBefore.minus(amount);
      if (balanceAfter.lessThan(0)) throw new BadRequestException("Supplier adjustment cannot make balance negative.");
      await tx.supplier.update({ where: { id: supplier.id }, data: { currentBalance: balanceAfter } });
      const created = await tx.supplierTransaction.create({
        data: {
          storeId: supplier.storeId,
          branchId: dto.branchId,
          supplierId: supplier.id,
          userId: user.id,
          type,
          amount,
          balanceBefore,
          balanceAfter,
          reason: dto.reason.trim(),
          notes: cleanNullable(dto.notes),
        },
        include: transactionInclude,
      });
      await tx.activityLog.create({
        data: {
          storeId: supplier.storeId,
          branchId: dto.branchId,
          userId: user.id,
          action: "supplier.balance_adjusted",
          entityType: "Supplier",
          entityId: supplier.id,
          metadata: { amount: Number(amount), direction: dto.direction, balanceAfter: Number(balanceAfter), reason: dto.reason },
        },
      });
      return created;
    });
    return this.serializeTransaction(transaction);
  }

  private requireStore(user: AuthenticatedUser) {
    if (user.isSuperAdmin || !user.storeId) throw new ForbiddenException("Suppliers require a store user context.");
    return user.storeId;
  }

  private async getScopedSupplier(user: AuthenticatedUser, id: string) {
    const storeId = this.requireStore(user);
    const supplier = await this.prisma.supplier.findFirst({ where: { id, storeId, deletedAt: null }, include: supplierInclude });
    if (!supplier) throw new NotFoundException("Supplier not found.");
    return supplier;
  }

  private async ensureUniquePhone(storeId: string, phone: string, excludeId?: string) {
    const existing = await this.prisma.supplier.findFirst({ where: { storeId, phone, id: excludeId ? { not: excludeId } : undefined, deletedAt: null } });
    if (existing) throw new ConflictException("Supplier phone already exists in this store.");
  }

  private async assertBranch(storeId: string, branchId: string) {
    const branch = await this.prisma.branch.findFirst({ where: { id: branchId, storeId, status: "ACTIVE" } });
    if (!branch) throw new BadRequestException("Branch does not belong to this store.");
  }

  private serializeSupplier(supplier: Prisma.SupplierGetPayload<{ include: typeof supplierInclude }>) {
    return { ...supplier, currentBalance: Number(supplier.currentBalance) };
  }

  private serializeTransaction(transaction: Prisma.SupplierTransactionGetPayload<{ include: typeof transactionInclude }>) {
    return {
      ...transaction,
      amount: Number(transaction.amount),
      balanceBefore: Number(transaction.balanceBefore),
      balanceAfter: Number(transaction.balanceAfter),
      purchaseOrder: transaction.purchaseOrder ? { ...transaction.purchaseOrder, total: Number(transaction.purchaseOrder.total) } : null,
    };
  }

  private log(user: AuthenticatedUser, action: string, entityId: string, metadata: Record<string, unknown>) {
    return this.activityLogs.log({
      storeId: user.storeId,
      branchId: user.branchId,
      userId: user.id,
      action,
      entityType: "Supplier",
      entityId,
      metadata: metadata as Prisma.InputJsonObject,
    });
  }
}

function cleanNullable(value?: string | null) {
  const cleaned = value?.trim();
  return cleaned ? cleaned : value === null ? null : undefined;
}
