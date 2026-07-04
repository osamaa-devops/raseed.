import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { CustomerDebtTransactionType, Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import type { AuthenticatedUser } from "../../common/utils/auth.types";
import { ActivityLogsService } from "../activity-logs/activity-logs.service";
import { AddDebtDto, AdjustDebtDto, GetDebtTransactionsQueryDto, PayDebtDto } from "./dto/customer-debt.dto";
import { CreateCustomerDto } from "./dto/create-customer.dto";
import { GetCustomersQueryDto } from "./dto/get-customers-query.dto";
import { UpdateCustomerStatusDto } from "./dto/update-customer-status.dto";
import { UpdateCustomerDto } from "./dto/update-customer.dto";

const customerInclude = {
  _count: { select: { invoices: true, debtTransactions: true } },
} as const;

const debtInclude = {
  branch: true,
  user: { select: { id: true, name: true, email: true } },
  invoice: { select: { id: true, invoiceNumber: true, total: true, status: true } },
} as const;

@Injectable()
export class CustomersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLogs: ActivityLogsService,
  ) {}

  async list(user: AuthenticatedUser, query: GetCustomersQueryDto) {
    const storeId = this.requireStore(user);
    const search = query.search?.trim();
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.CustomerWhereInput = {
      storeId,
      status: query.status,
      deletedAt: null,
      currentDebt: query.hasDebt === "true" ? { gt: 0 } : query.hasDebt === "false" ? { equals: 0 } : undefined,
      OR: search
        ? [
            { name: { contains: search, mode: "insensitive" } },
            { phone: { contains: search, mode: "insensitive" } },
          ]
        : undefined,
    };
    const [items, total, debtSummary] = await Promise.all([
      this.prisma.customer.findMany({ where, include: customerInclude, orderBy: { updatedAt: "desc" }, skip: (page - 1) * limit, take: limit }),
      this.prisma.customer.count({ where }),
      this.prisma.customer.aggregate({ where: { storeId, deletedAt: null }, _sum: { currentDebt: true }, _count: { id: true } }),
    ]);
    return {
      items: items.map((item) => this.serializeCustomer(item)),
      meta: { page, limit, total, pages: Math.ceil(total / limit) },
      summary: { totalDebt: Number(debtSummary._sum.currentDebt ?? 0), customersCount: debtSummary._count.id },
    };
  }

  async get(user: AuthenticatedUser, id: string) {
    const customer = await this.getScopedCustomer(user, id);
    return this.serializeCustomer(customer);
  }

  async create(user: AuthenticatedUser, dto: CreateCustomerDto) {
    const storeId = this.requireStore(user);
    const phone = dto.phone.trim();
    await this.ensureUniquePhone(storeId, phone);
    const customer = await this.prisma.customer.create({
      data: {
        storeId,
        name: dto.name.trim(),
        phone,
        email: cleanNullable(dto.email),
        address: cleanNullable(dto.address),
        notes: cleanNullable(dto.notes),
        creditLimit: dto.creditLimit !== undefined ? new Prisma.Decimal(dto.creditLimit) : undefined,
      },
      include: customerInclude,
    });
    await this.log(user, "customer.created", customer.id, { name: customer.name, phone: customer.phone });
    return this.serializeCustomer(customer);
  }

  async update(user: AuthenticatedUser, id: string, dto: UpdateCustomerDto) {
    const existing = await this.getScopedCustomer(user, id);
    const phone = dto.phone?.trim();
    if (phone && phone !== existing.phone) await this.ensureUniquePhone(existing.storeId, phone, id);
    const customer = await this.prisma.customer.update({
      where: { id },
      data: {
        name: dto.name?.trim(),
        phone,
        email: dto.email === null ? null : cleanNullable(dto.email),
        address: dto.address === null ? null : cleanNullable(dto.address),
        notes: dto.notes === null ? null : cleanNullable(dto.notes),
        creditLimit: dto.creditLimit === null ? null : dto.creditLimit !== undefined ? new Prisma.Decimal(dto.creditLimit) : undefined,
      },
      include: customerInclude,
    });
    await this.log(user, "customer.updated", customer.id, { name: customer.name, phone: customer.phone });
    return this.serializeCustomer(customer);
  }

  async updateStatus(user: AuthenticatedUser, id: string, dto: UpdateCustomerStatusDto) {
    await this.getScopedCustomer(user, id);
    const customer = await this.prisma.customer.update({ where: { id }, data: { status: dto.status }, include: customerInclude });
    await this.log(user, "customer.status_changed", customer.id, { status: customer.status });
    return this.serializeCustomer(customer);
  }

  async delete(user: AuthenticatedUser, id: string) {
    const existing = await this.getScopedCustomer(user, id);
    await this.prisma.customer.update({ where: { id }, data: { deletedAt: new Date(), status: "INACTIVE" } });
    await this.log(user, "customer.deleted", id, { name: existing.name, phone: existing.phone });
    return { success: true };
  }

  async debtTransactions(user: AuthenticatedUser, id: string, query: GetDebtTransactionsQueryDto) {
    const customer = await this.getScopedCustomer(user, id);
    if (query.branchId) await this.assertBranch(customer.storeId, query.branchId);
    const items = await this.prisma.customerDebtTransaction.findMany({
      where: { storeId: customer.storeId, customerId: customer.id, branchId: query.branchId || undefined },
      include: debtInclude,
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return { items: items.map((item) => this.serializeDebtTransaction(item)) };
  }

  async addDebt(user: AuthenticatedUser, id: string, dto: AddDebtDto) {
    const customer = await this.getScopedCustomer(user, id);
    if (dto.branchId) await this.assertBranch(customer.storeId, dto.branchId);
    const amount = new Prisma.Decimal(dto.amount);
    const updated = await this.prisma.$transaction(async (tx) => {
      const current = await tx.customer.findUniqueOrThrow({ where: { id: customer.id } });
      const balanceBefore = current.currentDebt;
      const balanceAfter = balanceBefore.plus(amount);
      await tx.customer.update({ where: { id: customer.id }, data: { currentDebt: balanceAfter } });
      const transaction = await tx.customerDebtTransaction.create({
        data: {
          storeId: customer.storeId,
          branchId: dto.branchId,
          customerId: customer.id,
          userId: user.id,
          type: "DEBT_ADDED",
          amount,
          balanceBefore,
          balanceAfter,
          reason: dto.reason.trim(),
          notes: dto.notes?.trim(),
        },
        include: debtInclude,
      });
      await tx.activityLog.create({
        data: {
          storeId: customer.storeId,
          branchId: dto.branchId,
          userId: user.id,
          action: "customer.debt_added",
          entityType: "Customer",
          entityId: customer.id,
          metadata: { amount: Number(amount), balanceAfter: Number(balanceAfter), reason: dto.reason },
        },
      });
      return transaction;
    });
    return this.serializeDebtTransaction(updated);
  }

  async payDebt(user: AuthenticatedUser, id: string, dto: PayDebtDto) {
    const customer = await this.getScopedCustomer(user, id);
    if (dto.branchId) await this.assertBranch(customer.storeId, dto.branchId);
    const amount = new Prisma.Decimal(dto.amount);
    const updated = await this.prisma.$transaction(async (tx) => {
      const current = await tx.customer.findUniqueOrThrow({ where: { id: customer.id } });
      if (amount.greaterThan(current.currentDebt)) throw new BadRequestException("Debt payment cannot exceed current debt.");
      const balanceBefore = current.currentDebt;
      const balanceAfter = balanceBefore.minus(amount);
      await tx.customer.update({ where: { id: customer.id }, data: { currentDebt: balanceAfter } });
      const transaction = await tx.customerDebtTransaction.create({
        data: {
          storeId: customer.storeId,
          branchId: dto.branchId,
          customerId: customer.id,
          userId: user.id,
          type: "PAYMENT_RECEIVED",
          amount,
          balanceBefore,
          balanceAfter,
          paymentMethod: dto.paymentMethod,
          reason: "Debt payment",
          notes: dto.notes?.trim(),
        },
        include: debtInclude,
      });
      await tx.activityLog.create({
        data: {
          storeId: customer.storeId,
          branchId: dto.branchId,
          userId: user.id,
          action: "customer.debt_payment_received",
          entityType: "Customer",
          entityId: customer.id,
          metadata: { amount: Number(amount), paymentMethod: dto.paymentMethod, balanceAfter: Number(balanceAfter) },
        },
      });
      return transaction;
    });
    return this.serializeDebtTransaction(updated);
  }

  async adjustDebt(user: AuthenticatedUser, id: string, dto: AdjustDebtDto) {
    const customer = await this.getScopedCustomer(user, id);
    if (dto.branchId) await this.assertBranch(customer.storeId, dto.branchId);
    const amount = new Prisma.Decimal(dto.amount);
    const type: CustomerDebtTransactionType = dto.direction === "IN" ? "ADJUSTMENT_IN" : "ADJUSTMENT_OUT";
    const updated = await this.prisma.$transaction(async (tx) => {
      const current = await tx.customer.findUniqueOrThrow({ where: { id: customer.id } });
      const balanceBefore = current.currentDebt;
      const balanceAfter = dto.direction === "IN" ? balanceBefore.plus(amount) : balanceBefore.minus(amount);
      if (balanceAfter.lessThan(0)) throw new BadRequestException("Debt adjustment cannot make balance negative.");
      await tx.customer.update({ where: { id: customer.id }, data: { currentDebt: balanceAfter } });
      const transaction = await tx.customerDebtTransaction.create({
        data: {
          storeId: customer.storeId,
          branchId: dto.branchId,
          customerId: customer.id,
          userId: user.id,
          type,
          amount,
          balanceBefore,
          balanceAfter,
          reason: dto.reason.trim(),
          notes: dto.notes?.trim(),
        },
        include: debtInclude,
      });
      await tx.activityLog.create({
        data: {
          storeId: customer.storeId,
          branchId: dto.branchId,
          userId: user.id,
          action: "customer.debt_adjusted",
          entityType: "Customer",
          entityId: customer.id,
          metadata: { amount: Number(amount), direction: dto.direction, balanceAfter: Number(balanceAfter), reason: dto.reason },
        },
      });
      return transaction;
    });
    return this.serializeDebtTransaction(updated);
  }

  private requireStore(user: AuthenticatedUser) {
    if (user.isSuperAdmin || !user.storeId) throw new ForbiddenException("Customers require a store user context.");
    return user.storeId;
  }

  private async getScopedCustomer(user: AuthenticatedUser, id: string) {
    const storeId = this.requireStore(user);
    const customer = await this.prisma.customer.findFirst({ where: { id, storeId, deletedAt: null }, include: customerInclude });
    if (!customer) throw new NotFoundException("Customer not found.");
    return customer;
  }

  private async ensureUniquePhone(storeId: string, phone: string, excludeId?: string) {
    const existing = await this.prisma.customer.findFirst({ where: { storeId, phone, id: excludeId ? { not: excludeId } : undefined } });
    if (existing) throw new ConflictException("Customer phone already exists in this store.");
  }

  private async assertBranch(storeId: string, branchId: string) {
    const branch = await this.prisma.branch.findFirst({ where: { id: branchId, storeId, status: "ACTIVE" } });
    if (!branch) throw new BadRequestException("Branch does not belong to this store.");
  }

  private serializeCustomer(customer: Prisma.CustomerGetPayload<{ include: typeof customerInclude }>) {
    return {
      ...customer,
      creditLimit: customer.creditLimit === null ? null : Number(customer.creditLimit),
      currentDebt: Number(customer.currentDebt),
    };
  }

  private serializeDebtTransaction(transaction: Prisma.CustomerDebtTransactionGetPayload<{ include: typeof debtInclude }>) {
    return {
      ...transaction,
      amount: Number(transaction.amount),
      balanceBefore: Number(transaction.balanceBefore),
      balanceAfter: Number(transaction.balanceAfter),
      invoice: transaction.invoice ? { ...transaction.invoice, total: Number(transaction.invoice.total) } : null,
    };
  }

  private log(user: AuthenticatedUser, action: string, entityId: string, metadata: Record<string, unknown>) {
    return this.activityLogs.log({
      storeId: user.storeId,
      branchId: user.branchId,
      userId: user.id,
      action,
      entityType: "Customer",
      entityId,
      metadata: metadata as Prisma.InputJsonObject,
    });
  }
}

function cleanNullable(value?: string | null) {
  const cleaned = value?.trim();
  return cleaned ? cleaned : undefined;
}
