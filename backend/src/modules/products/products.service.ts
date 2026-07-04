import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { Category, Prisma, Product } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { UpdateCatalogStatusDto } from "../../common/dto/update-catalog-status.dto";
import type { AuthenticatedUser } from "../../common/utils/auth.types";
import { assertStoreAccess } from "../../common/utils/tenant-context";
import { ActivityLogsService } from "../activity-logs/activity-logs.service";
import { CreateProductDto } from "./dto/create-product.dto";
import { ListProductsDto } from "./dto/list-products.dto";
import { UpdateProductDto } from "./dto/update-product.dto";

const productInclude = { category: true } as const;

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLogs: ActivityLogsService,
  ) {}

  async list(user: AuthenticatedUser, query: ListProductsDto) {
    const storeId = this.requireStore(user);
    const where: Prisma.ProductWhereInput = {
      storeId,
      categoryId: query.categoryId || undefined,
      status: query.status,
      OR: query.search?.trim()
        ? [
            { name: { contains: query.search.trim(), mode: "insensitive" } },
            { barcode: { contains: query.search.trim(), mode: "insensitive" } },
            { sku: { contains: query.search.trim(), mode: "insensitive" } },
          ]
        : undefined,
    };

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const [items, total] = await this.prisma.$transaction([
      this.prisma.product.findMany({
        where,
        include: productInclude,
        orderBy: { [query.sortBy ?? "createdAt"]: query.sortDir ?? "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      items: items.map((product) => this.serialize(product)),
      meta: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  async getById(user: AuthenticatedUser, id: string) {
    const product = await this.prisma.product.findUnique({ where: { id }, include: productInclude });
    if (!product) throw new NotFoundException("Product not found.");
    assertStoreAccess(user, product.storeId);
    return this.serialize(product);
  }

  async create(user: AuthenticatedUser, dto: CreateProductDto) {
    const storeId = this.requireStore(user);
    const data = await this.prepareData(storeId, dto);
    await this.ensureUniqueIdentifiers(storeId, data.barcode, data.sku);
    const product = await this.prisma.product.create({
      data: {
        storeId,
        name: dto.name.trim(),
        categoryId: data.categoryId,
        barcode: data.barcode,
        sku: data.sku,
        description: data.description,
        imageUrl: data.imageUrl,
        purchasePrice: new Prisma.Decimal(dto.purchasePrice),
        sellingPrice: new Prisma.Decimal(dto.sellingPrice),
        unitType: dto.unitType.trim(),
        minStock: dto.minStock,
        expiryDate: data.expiryDate,
      },
      include: productInclude,
    });
    await this.log(user, "product.created", product.id, { name: product.name, barcode: product.barcode });
    return this.serialize(product);
  }

  async update(user: AuthenticatedUser, id: string, dto: UpdateProductDto) {
    const existing = await this.prisma.product.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("Product not found.");
    assertStoreAccess(user, existing.storeId);
    const data = await this.prepareData(existing.storeId, dto);
    await this.ensureUniqueIdentifiers(existing.storeId, data.barcode, data.sku, id);
    const product = await this.prisma.product.update({
      where: { id },
      data,
      include: productInclude,
    });
    await this.log(user, "product.updated", product.id, { name: product.name });
    return this.serialize(product);
  }

  async updateStatus(user: AuthenticatedUser, id: string, dto: UpdateCatalogStatusDto) {
    await this.getById(user, id);
    const product = await this.prisma.product.update({ where: { id }, data: { status: dto.status }, include: productInclude });
    await this.log(user, "product.status_changed", product.id, { status: product.status });
    return this.serialize(product);
  }

  async delete(user: AuthenticatedUser, id: string) {
    const existing = await this.prisma.product.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("Product not found.");
    assertStoreAccess(user, existing.storeId);
    await this.prisma.product.delete({ where: { id } });
    await this.log(user, "product.deleted", id, { name: existing.name });
    return { success: true };
  }

  private requireStore(user: AuthenticatedUser) {
    if (user.isSuperAdmin || !user.storeId) {
      throw new ForbiddenException("Store product CRUD requires a store user context.");
    }
    return user.storeId;
  }

  private async prepareData(storeId: string, dto: CreateProductDto | UpdateProductDto) {
    const categoryId = dto.categoryId === null ? null : dto.categoryId?.trim();
    if (categoryId) {
      const category = await this.prisma.category.findUnique({ where: { id: categoryId } });
      if (!category || category.storeId !== storeId) {
        throw new BadRequestException("Category does not belong to this store.");
      }
    }

    return {
      categoryId,
      name: dto.name?.trim(),
      barcode: this.cleanOptional(dto.barcode),
      sku: this.cleanOptional(dto.sku),
      description: dto.description === null ? null : dto.description?.trim(),
      imageUrl: dto.imageUrl === null ? null : dto.imageUrl?.trim(),
      purchasePrice: dto.purchasePrice !== undefined ? new Prisma.Decimal(dto.purchasePrice) : undefined,
      sellingPrice: dto.sellingPrice !== undefined ? new Prisma.Decimal(dto.sellingPrice) : undefined,
      unitType: dto.unitType?.trim(),
      minStock: dto.minStock,
      expiryDate: dto.expiryDate === null ? null : dto.expiryDate ? new Date(dto.expiryDate) : undefined,
    };
  }

  private cleanOptional(value?: string | null) {
    const cleaned = value?.trim();
    return cleaned ? cleaned : value === null ? null : undefined;
  }

  private async ensureUniqueIdentifiers(storeId: string, barcode?: string | null, sku?: string | null, excludeId?: string) {
    if (barcode) {
      const existing = await this.prisma.product.findFirst({ where: { storeId, barcode, id: excludeId ? { not: excludeId } : undefined } });
      if (existing) throw new ConflictException("Barcode already exists in this store.");
    }
    if (sku) {
      const existing = await this.prisma.product.findFirst({ where: { storeId, sku, id: excludeId ? { not: excludeId } : undefined } });
      if (existing) throw new ConflictException("SKU already exists in this store.");
    }
  }

  private serialize(product: Product & { category?: Category | null }) {
    const purchasePrice = Number(product.purchasePrice);
    const sellingPrice = Number(product.sellingPrice);
    const profitMargin = sellingPrice === 0 ? 0 : Number((((sellingPrice - purchasePrice) / sellingPrice) * 100).toFixed(2));
    return { ...product, purchasePrice, sellingPrice, profitMargin };
  }

  private log(user: AuthenticatedUser, action: string, entityId: string, metadata: Record<string, unknown>) {
    return this.activityLogs.log({
      storeId: user.storeId,
      branchId: user.branchId,
      userId: user.id,
      action,
      entityType: "Product",
      entityId,
      metadata: metadata as Prisma.InputJsonObject,
    });
  }
}
