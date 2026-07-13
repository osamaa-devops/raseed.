import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import type { AuthenticatedUser } from "../../common/utils/auth.types";
import { ActivityLogsService } from "../activity-logs/activity-logs.service";
import { CloseShiftDto } from "./dto/close-shift.dto";
import { GetShiftsQueryDto } from "./dto/get-shifts-query.dto";
import { OpenShiftDto } from "./dto/open-shift.dto";

const shiftInclude = {
  branch: true,
  cashier: { select: { id: true, name: true, email: true } },
} as const;

@Injectable()
export class ShiftsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLogs: ActivityLogsService,
  ) {}

  async current(user: AuthenticatedUser, branchId?: string) {
    const storeId = this.requireStore(user);
    const scopedBranchId = await this.resolveBranchId(storeId, user, branchId);
    const shift = await this.prisma.cashierShift.findFirst({
      where: { storeId, branchId: scopedBranchId, cashierId: user.id, status: "OPEN" },
      include: shiftInclude,
      orderBy: { openedAt: "desc" },
    });
    return shift ? this.serializeShift(shift) : null;
  }

  async open(user: AuthenticatedUser, dto: OpenShiftDto) {
    const storeId = this.requireStore(user);
    await this.assertBranch(storeId, dto.branchId);
    const existing = await this.prisma.cashierShift.findFirst({ where: { storeId, cashierId: user.id, status: "OPEN" } });
    if (existing) throw new BadRequestException("There is already an open shift for this cashier.");
    const shift = await this.prisma.cashierShift.create({
      data: {
        storeId,
        branchId: dto.branchId,
        cashierId: user.id,
        openingCash: new Prisma.Decimal(dto.openingCash),
        notes: dto.notes?.trim(),
      },
      include: shiftInclude,
    });
    await this.log(user, dto.branchId, "shift.opened", shift.id, { openingCash: dto.openingCash });
    return this.serializeShift(shift);
  }

  async close(user: AuthenticatedUser, dto: CloseShiftDto) {
    const storeId = this.requireStore(user);
    const shift = await this.prisma.cashierShift.findUnique({ where: { id: dto.shiftId }, include: shiftInclude });
    if (!shift || shift.storeId !== storeId) throw new NotFoundException("Shift not found.");
    if (shift.status !== "OPEN") throw new BadRequestException("Shift is already closed.");
    if (shift.cashierId !== user.id && !this.canManageOthers(user)) {
      throw new ForbiddenException("Only the cashier or a manager can close this shift.");
    }
    const cashPayments = await this.prisma.payment.aggregate({
      where: { storeId, branchId: shift.branchId, method: "CASH", amount: { gt: 0 }, invoice: { shiftId: shift.id } },
      _sum: { amount: true },
    });
    const cashReturns = await this.prisma.return.aggregate({
      where: { storeId, branchId: shift.branchId, shiftId: shift.id, refundMethod: "CASH", status: "COMPLETED" },
      _sum: { refundTotal: true },
    });
    const expectedCash = shift.openingCash.plus(cashPayments._sum.amount ?? 0).minus(cashReturns._sum.refundTotal ?? 0);
    const actualCash = new Prisma.Decimal(dto.actualCash);
    const difference = actualCash.minus(expectedCash);
    const updated = await this.prisma.cashierShift.update({
      where: { id: shift.id },
      data: {
        status: "CLOSED",
        actualCash,
        expectedCash,
        difference,
        closingCash: actualCash,
        closedAt: new Date(),
        notes: dto.notes?.trim() ?? shift.notes,
      },
      include: shiftInclude,
    });
    await this.log(user, shift.branchId, "shift.closed", shift.id, {
      actualCash: dto.actualCash,
      expectedCash: Number(expectedCash),
      cashReturns: Number(cashReturns._sum.refundTotal ?? 0),
      difference: Number(difference),
    });
    return this.serializeShift(updated);
  }

  async list(user: AuthenticatedUser, query: GetShiftsQueryDto) {
    const storeId = this.requireStore(user);
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const where: Prisma.CashierShiftWhereInput = {
      storeId,
      branchId: query.branchId || undefined,
      cashierId: query.cashierId || undefined,
      status: query.status,
      openedAt: {
        gte: query.dateFrom ? new Date(query.dateFrom) : undefined,
        lte: query.dateTo ? new Date(query.dateTo) : undefined,
      },
    };
    if (!this.canManageOthers(user)) where.cashierId = user.id;
    const [items, total] = await this.prisma.$transaction([
      this.prisma.cashierShift.findMany({ where, include: shiftInclude, orderBy: { openedAt: "desc" }, skip: (page - 1) * limit, take: limit }),
      this.prisma.cashierShift.count({ where }),
    ]);
    return { items: items.map((shift) => this.serializeShift(shift)), meta: { page, limit, total, pages: Math.ceil(total / limit) } };
  }

  private requireStore(user: AuthenticatedUser) {
    if (user.isSuperAdmin || !user.storeId) throw new ForbiddenException("Shift operations require a store user context.");
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
    return branch;
  }

  private canManageOthers(user: AuthenticatedUser) {
    return user.roleName === "owner" || user.roleName === "manager" || user.permissions.includes("users.manage");
  }

  private serializeShift(shift: Prisma.CashierShiftGetPayload<{ include: typeof shiftInclude }>) {
    return {
      ...shift,
      openingCash: Number(shift.openingCash),
      closingCash: shift.closingCash === null ? null : Number(shift.closingCash),
      expectedCash: shift.expectedCash === null ? null : Number(shift.expectedCash),
      actualCash: shift.actualCash === null ? null : Number(shift.actualCash),
      difference: shift.difference === null ? null : Number(shift.difference),
    };
  }

  private log(user: AuthenticatedUser, branchId: string, action: string, entityId: string, metadata: Record<string, unknown>) {
    return this.activityLogs.log({
      storeId: user.storeId,
      branchId,
      userId: user.id,
      action,
      entityType: "CashierShift",
      entityId,
      metadata: metadata as Prisma.InputJsonObject,
    });
  }
}
