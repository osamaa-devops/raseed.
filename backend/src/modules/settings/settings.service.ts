import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { BarcodeLabelSettings, Prisma, ReceiptSettings } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import type { AuthenticatedUser } from "../../common/utils/auth.types";
import { ActivityLogsService } from "../activity-logs/activity-logs.service";
import { UpdateBarcodeLabelSettingsDto } from "./dto/barcode-label-settings.dto";
import { UpdateReceiptSettingsDto } from "./dto/receipt-settings.dto";

@Injectable()
export class SettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLogs: ActivityLogsService,
  ) {}

  async getReceiptSettings(user: AuthenticatedUser, branchId?: string | null) {
    const storeId = this.requireStore(user);
    const scopedBranchId = await this.resolveBranch(storeId, branchId);
    const settings = scopedBranchId
      ? await this.prisma.receiptSettings.findFirst({ where: { storeId, branchId: scopedBranchId } })
      : null;
    const fallback = await this.getOrCreateDefaultReceiptSettings(storeId);
    return this.serializeReceiptSettings(settings ?? fallback);
  }

  async updateReceiptSettings(user: AuthenticatedUser, dto: UpdateReceiptSettingsDto) {
    const storeId = this.requireStore(user);
    const branchId = await this.resolveBranch(storeId, dto.branchId);
    const existing = await this.prisma.receiptSettings.findFirst({ where: { storeId, branchId } });
    const data = this.cleanReceiptSettings(dto);
    const settings = existing
      ? await this.prisma.receiptSettings.update({ where: { id: existing.id }, data })
      : await this.prisma.receiptSettings.create({ data: { storeId, branchId, ...data } });

    await this.activityLogs.log({
      storeId,
      branchId: user.branchId,
      userId: user.id,
      action: "settings.receipt.updated",
      entityType: "ReceiptSettings",
      entityId: settings.id,
      metadata: { branchId, paperSize: settings.paperSize } as Prisma.InputJsonObject,
    });

    return this.serializeReceiptSettings(settings);
  }

  async getBarcodeLabelSettings(user: AuthenticatedUser) {
    const storeId = this.requireStore(user);
    return this.serializeBarcodeSettings(await this.getOrCreateBarcodeLabelSettings(storeId));
  }

  async updateBarcodeLabelSettings(user: AuthenticatedUser, dto: UpdateBarcodeLabelSettingsDto) {
    const storeId = this.requireStore(user);
    const data = this.cleanBarcodeSettings(dto);
    const existing = await this.getOrCreateBarcodeLabelSettings(storeId);
    const settings = await this.prisma.barcodeLabelSettings.update({ where: { id: existing.id }, data });

    await this.activityLogs.log({
      storeId,
      branchId: user.branchId,
      userId: user.id,
      action: "settings.barcode_labels.updated",
      entityType: "BarcodeLabelSettings",
      entityId: settings.id,
      metadata: { labelSize: settings.labelSize, columns: settings.columns } as Prisma.InputJsonObject,
    });

    return this.serializeBarcodeSettings(settings);
  }

  async getOrCreateDefaultReceiptSettings(storeId: string) {
    const existing = await this.prisma.receiptSettings.findFirst({ where: { storeId, branchId: null } });
    if (existing) return existing;
    const store = await this.prisma.store.findUnique({ where: { id: storeId } });
    if (!store) throw new NotFoundException("Store not found.");
    return this.prisma.receiptSettings.create({
      data: {
        storeId,
        storeName: store.name,
        storePhone: store.phone,
        storeAddress: store.legalName,
        taxNumber: store.taxNumber,
      },
    });
  }

  async getOrCreateBarcodeLabelSettings(storeId: string) {
    const existing = await this.prisma.barcodeLabelSettings.findUnique({ where: { storeId } });
    if (existing) return existing;
    return this.prisma.barcodeLabelSettings.create({ data: { storeId } });
  }

  private requireStore(user: AuthenticatedUser) {
    if (user.isSuperAdmin || !user.storeId) throw new ForbiddenException("Settings require a store user context.");
    return user.storeId;
  }

  private async resolveBranch(storeId: string, branchId?: string | null) {
    if (!branchId) return null;
    const branch = await this.prisma.branch.findUnique({ where: { id: branchId } });
    if (!branch || branch.storeId !== storeId) throw new BadRequestException("Branch does not belong to this store.");
    return branch.id;
  }

  private cleanReceiptSettings(dto: UpdateReceiptSettingsDto) {
    const { branchId: _branchId, ...rest } = dto;
    return Object.fromEntries(
      Object.entries(rest).map(([key, value]) => [key, typeof value === "string" ? value.trim() || null : value]).filter(([, value]) => value !== undefined),
    ) as Omit<Prisma.ReceiptSettingsUncheckedCreateInput, "id" | "storeId" | "branchId" | "createdAt" | "updatedAt">;
  }

  private cleanBarcodeSettings(dto: UpdateBarcodeLabelSettingsDto) {
    return Object.fromEntries(
      Object.entries(dto).filter(([, value]) => value !== undefined),
    ) as Prisma.BarcodeLabelSettingsUncheckedUpdateInput;
  }

  private serializeReceiptSettings(settings: ReceiptSettings | null) {
    if (!settings) return settings;
    return settings;
  }

  private serializeBarcodeSettings(settings: BarcodeLabelSettings | null) {
    if (!settings) return settings;
    return {
      ...settings,
      marginTop: settings.marginTop === null ? null : Number(settings.marginTop),
      marginRight: settings.marginRight === null ? null : Number(settings.marginRight),
      marginBottom: settings.marginBottom === null ? null : Number(settings.marginBottom),
      marginLeft: settings.marginLeft === null ? null : Number(settings.marginLeft),
    };
  }
}
