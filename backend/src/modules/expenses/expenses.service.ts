import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import type { AuthenticatedUser } from "../../common/utils/auth.types";
import { ActivityLogsService } from "../activity-logs/activity-logs.service";
import { CreateExpenseDto } from "./dto/create-expense.dto";
import { GetExpensesQueryDto } from "./dto/get-expenses-query.dto";
import { UpdateExpenseDto } from "./dto/update-expense.dto";

const expenseInclude = {
  branch: true,
  user: { select: { id: true, name: true, email: true } },
} as const;

@Injectable()
export class ExpensesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLogs: ActivityLogsService,
  ) {}

  async list(user: AuthenticatedUser, query: GetExpensesQueryDto) {
    const storeId = this.requireStore(user);
    const where = this.buildWhere(storeId, query);
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const [items, total, summary] = await Promise.all([
      this.prisma.expense.findMany({
        where,
        include: expenseInclude,
        orderBy: { expenseDate: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.expense.count({ where }),
      this.getSummary(storeId, query.branchId),
    ]);
    return {
      items: items.map((item) => this.serialize(item)),
      meta: { page, limit, total, pages: Math.ceil(total / limit) },
      summary,
    };
  }

  async get(user: AuthenticatedUser, id: string) {
    const storeId = this.requireStore(user);
    const expense = await this.prisma.expense.findFirst({ where: { id, storeId, deletedAt: null }, include: expenseInclude });
    if (!expense) throw new NotFoundException("Expense not found.");
    return this.serialize(expense);
  }

  async create(user: AuthenticatedUser, dto: CreateExpenseDto) {
    const storeId = this.requireStore(user);
    await this.assertBranch(storeId, dto.branchId);
    const expense = await this.prisma.expense.create({
      data: {
        storeId,
        branchId: dto.branchId,
        userId: user.id,
        title: dto.title.trim(),
        category: dto.category,
        amount: new Prisma.Decimal(dto.amount),
        expenseDate: dto.expenseDate ? new Date(dto.expenseDate) : new Date(),
        notes: dto.notes?.trim(),
        attachmentUrl: dto.attachmentUrl?.trim(),
      },
      include: expenseInclude,
    });
    await this.log(user, expense.branchId, "expense.created", expense.id, { title: expense.title, amount: Number(expense.amount) });
    return this.serialize(expense);
  }

  async update(user: AuthenticatedUser, id: string, dto: UpdateExpenseDto) {
    const storeId = this.requireStore(user);
    const existing = await this.prisma.expense.findFirst({ where: { id, storeId, deletedAt: null } });
    if (!existing) throw new NotFoundException("Expense not found.");
    if (dto.branchId) await this.assertBranch(storeId, dto.branchId);
    const expense = await this.prisma.expense.update({
      where: { id },
      data: {
        branchId: dto.branchId,
        title: dto.title?.trim(),
        category: dto.category,
        amount: dto.amount !== undefined ? new Prisma.Decimal(dto.amount) : undefined,
        expenseDate: dto.expenseDate ? new Date(dto.expenseDate) : undefined,
        notes: dto.notes === null ? null : dto.notes?.trim(),
        attachmentUrl: dto.attachmentUrl === null ? null : dto.attachmentUrl?.trim(),
      },
      include: expenseInclude,
    });
    await this.log(user, expense.branchId, "expense.updated", expense.id, { title: expense.title, amount: Number(expense.amount) });
    return this.serialize(expense);
  }

  async delete(user: AuthenticatedUser, id: string) {
    const storeId = this.requireStore(user);
    const existing = await this.prisma.expense.findFirst({ where: { id, storeId, deletedAt: null } });
    if (!existing) throw new NotFoundException("Expense not found.");
    await this.prisma.expense.update({ where: { id }, data: { deletedAt: new Date() } });
    await this.log(user, existing.branchId, "expense.deleted", existing.id, { title: existing.title, amount: Number(existing.amount) });
    return { success: true };
  }

  private buildWhere(storeId: string, query: GetExpensesQueryDto): Prisma.ExpenseWhereInput {
    const search = query.search?.trim();
    return {
      storeId,
      branchId: query.branchId || undefined,
      category: query.category,
      deletedAt: null,
      expenseDate: {
        gte: query.dateFrom ? startOfDay(new Date(query.dateFrom)) : undefined,
        lte: query.dateTo ? endOfDay(new Date(query.dateTo)) : undefined,
      },
      OR: search
        ? [
            { title: { contains: search, mode: "insensitive" } },
            { notes: { contains: search, mode: "insensitive" } },
          ]
        : undefined,
    };
  }

  private async getSummary(storeId: string, branchId?: string) {
    const now = new Date();
    const today = await this.sumExpenses(storeId, branchId, startOfDay(now), endOfDay(now));
    const month = await this.sumExpenses(storeId, branchId, new Date(now.getFullYear(), now.getMonth(), 1), endOfDay(now));
    const categories = await this.prisma.expense.groupBy({
      by: ["category"],
      where: { storeId, branchId: branchId || undefined, deletedAt: null, expenseDate: { gte: new Date(now.getFullYear(), now.getMonth(), 1), lte: endOfDay(now) } },
      _sum: { amount: true },
      orderBy: { _sum: { amount: "desc" } },
      take: 1,
    });
    return {
      today,
      month,
      topCategory: categories[0] ? { category: categories[0].category, amount: Number(categories[0]._sum.amount ?? 0) } : null,
    };
  }

  private async sumExpenses(storeId: string, branchId: string | undefined, dateFrom: Date, dateTo: Date) {
    const result = await this.prisma.expense.aggregate({
      where: { storeId, branchId: branchId || undefined, deletedAt: null, expenseDate: { gte: dateFrom, lte: dateTo } },
      _sum: { amount: true },
    });
    return Number(result._sum.amount ?? 0);
  }

  private requireStore(user: AuthenticatedUser) {
    if (user.isSuperAdmin || !user.storeId) throw new ForbiddenException("Expenses require a store user context.");
    return user.storeId;
  }

  private async assertBranch(storeId: string, branchId: string) {
    const branch = await this.prisma.branch.findFirst({ where: { id: branchId, storeId, status: "ACTIVE" } });
    if (!branch) throw new BadRequestException("Branch does not belong to this store.");
  }

  private serialize(expense: Prisma.ExpenseGetPayload<{ include: typeof expenseInclude }>) {
    return { ...expense, amount: Number(expense.amount) };
  }

  private log(user: AuthenticatedUser, branchId: string, action: string, entityId: string, metadata: Record<string, unknown>) {
    return this.activityLogs.log({
      storeId: user.storeId,
      branchId,
      userId: user.id,
      action,
      entityType: "Expense",
      entityId,
      metadata: metadata as Prisma.InputJsonObject,
    });
  }
}

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function endOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}
