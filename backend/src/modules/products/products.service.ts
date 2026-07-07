import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common";
import { CatalogStatus, Prisma, Product as PrismaProduct, ProductVariant as PrismaProductVariant } from "@prisma/client";
import { PrismaService } from "../../prisma/prisma.service";
import { UpdateCatalogStatusDto } from "../../common/dto/update-catalog-status.dto";
import type { AuthenticatedUser } from "../../common/utils/auth.types";
import { assertStoreAccess } from "../../common/utils/tenant-context";
import { ActivityLogsService } from "../activity-logs/activity-logs.service";
import { BarcodeLabelsDto } from "./dto/barcode-labels.dto";
import { CreateProductDto } from "./dto/create-product.dto";
import { ListProductsDto } from "./dto/list-products.dto";
import { UpdateProductDto } from "./dto/update-product.dto";

const productInclude = {
  category: true,
  variants: { orderBy: [{ createdAt: "asc" }] },
} satisfies Prisma.ProductInclude;

type ProductRecord = Prisma.ProductGetPayload<{ include: typeof productInclude }>;

@Injectable()
export class ProductsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLogs: ActivityLogsService,
  ) {}

  async list(user: AuthenticatedUser, query: ListProductsDto) {
    const storeId = this.requireStore(user);
    const search = query.search?.trim();
    const where: Prisma.ProductWhereInput = {
      storeId,
      categoryId: query.categoryId || undefined,
      status: query.status,
      OR: search
        ? [
            { name: { contains: search, mode: "insensitive" } },
            { brand: { contains: search, mode: "insensitive" } },
            { variants: { some: { OR: [{ sku: { contains: search, mode: "insensitive" } }, { barcode: { contains: search, mode: "insensitive" } }, { size: { contains: search, mode: "insensitive" } }, { color: { contains: search, mode: "insensitive" } }] } } },
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
    const data = await this.prepareProductData(storeId, dto);
    const variants = this.normalizeVariants(dto, data);
    await this.ensureProductIdentifiers(storeId, data.barcode, data.sku);
    await this.ensureVariantIdentifiers(storeId, variants);

    const product = await this.prisma.product.create({
      data: {
        storeId,
        name: data.name,
        categoryId: data.categoryId,
        brand: data.brand,
        gender: data.gender,
        season: data.season,
        barcode: data.barcode,
        sku: data.sku,
        description: data.description,
        imageUrl: data.imageUrl,
        unitType: data.unitType || "قطعة",
        expiryDate: data.expiryDate ?? null,
        purchasePrice: variants[0]?.costPrice ?? new Prisma.Decimal(0),
        sellingPrice: variants[0]?.sellingPrice ?? new Prisma.Decimal(0),
        minStock: variants[0]?.minStock ?? 0,
        status: data.status,
        variants: {
          create: variants.map((variant) => ({
            storeId,
            size: variant.size,
            color: variant.color,
            sku: variant.sku,
            barcode: variant.barcode,
            costPrice: variant.costPrice,
            sellingPrice: variant.sellingPrice,
            discountPrice: variant.discountPrice,
            stockQuantity: variant.stockQuantity,
            minStock: variant.minStock,
            status: variant.status,
          })),
        },
      },
      include: productInclude,
    });

    await this.log(user, "product.created", product.id, { name: product.name, variants: product.variants.length });
    return this.serialize(product);
  }

  async update(user: AuthenticatedUser, id: string, dto: UpdateProductDto) {
    const existing = await this.prisma.product.findUnique({ where: { id }, include: productInclude } as const);
    if (!existing) throw new NotFoundException("Product not found.");
    assertStoreAccess(user, existing.storeId);

    const data = await this.prepareProductData(existing.storeId, dto);
    const variants = this.normalizeVariants(dto, data, existing);
    await this.ensureProductIdentifiers(existing.storeId, data.barcode, data.sku, id);
    await this.ensureVariantIdentifiers(existing.storeId, variants, existing.variants);

    const product = await this.prisma.$transaction(async (tx) => {
      const updatedProduct = await tx.product.update({
        where: { id },
        data: {
          name: data.name,
          categoryId: data.categoryId,
          brand: data.brand,
          gender: data.gender,
          season: data.season,
          barcode: data.barcode,
          sku: data.sku,
          description: data.description,
          imageUrl: data.imageUrl,
          unitType: data.unitType || existing.unitType,
          expiryDate: data.expiryDate ?? existing.expiryDate,
          purchasePrice: variants[0]?.costPrice ?? existing.purchasePrice,
          sellingPrice: variants[0]?.sellingPrice ?? existing.sellingPrice,
          minStock: variants[0]?.minStock ?? existing.minStock,
          status: data.status ?? existing.status,
        },
      });

      await tx.productVariant.deleteMany({ where: { productId: id } });
      if (variants.length > 0) {
        await tx.productVariant.createMany({
          data: variants.map((variant) => ({
            storeId: existing.storeId,
            productId: updatedProduct.id,
            size: variant.size,
            color: variant.color,
            sku: variant.sku,
            barcode: variant.barcode,
            costPrice: variant.costPrice,
            sellingPrice: variant.sellingPrice,
            discountPrice: variant.discountPrice,
            stockQuantity: variant.stockQuantity,
            minStock: variant.minStock,
            status: variant.status,
          })),
        });
      }

      return tx.product.findUniqueOrThrow({ where: { id }, include: productInclude });
    });

    await this.log(user, "product.updated", product.id, { name: product.name, variants: product.variants.length });
    return this.serialize(product);
  }

  async updateStatus(user: AuthenticatedUser, id: string, dto: UpdateCatalogStatusDto) {
    const product = await this.getById(user, id);
    await this.prisma.productVariant.updateMany({ where: { productId: id }, data: { status: dto.status } });
    const updated = await this.prisma.product.update({ where: { id }, data: { status: dto.status }, include: productInclude });
    await this.log(user, "product.status_changed", updated.id, { status: updated.status });
    return this.serialize(updated);
  }

  async delete(user: AuthenticatedUser, id: string) {
    const existing = await this.prisma.product.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("Product not found.");
    assertStoreAccess(user, existing.storeId);
    await this.prisma.product.delete({ where: { id } });
    await this.log(user, "product.deleted", id, { name: existing.name });
    return { success: true };
  }

  async generateBarcode(user: AuthenticatedUser, id: string, force = false) {
    const existing = await this.prisma.product.findUnique({ where: { id }, include: { variants: true } });
    if (!existing) throw new NotFoundException("Product not found.");
    assertStoreAccess(user, existing.storeId);
    const target = existing.variants.find((variant) => !variant.barcode) ?? existing.variants[0];
    if (!target) throw new BadRequestException("Product has no variants.");
    if (target.barcode && !force) {
      return { productId: existing.id, barcode: target.barcode };
    }

    const barcode = await this.generateUniqueBarcode(existing.storeId);
    await this.prisma.productVariant.update({ where: { id: target.id }, data: { barcode } });
    await this.log(user, "product.barcode_generated", existing.id, { barcode, force, variantId: target.id });
    return { productId: existing.id, barcode };
  }

  async getBarcodeLabels(user: AuthenticatedUser, dto: BarcodeLabelsDto) {
    const storeId = this.requireStore(user);
    const productIds = Array.from(new Set(dto.productIds));
    const products = await this.prisma.product.findMany({
      where: { storeId, id: { in: productIds } },
      include: { variants: true },
      orderBy: { name: "asc" },
    });
    if (products.length !== productIds.length) throw new BadRequestException("Some products do not belong to this store.");

    const prepared = [];
    for (const product of products) {
      const variant = product.variants[0];
      let barcode = variant?.barcode ?? product.barcode;
      if (!barcode && dto.autoGenerate && variant) {
        barcode = await this.generateUniqueBarcode(storeId);
        await this.prisma.productVariant.update({ where: { id: variant.id }, data: { barcode } });
        await this.log(user, "product.barcode_generated", product.id, { barcode, autoGenerate: true, variantId: variant.id });
      }
      if (!barcode) throw new BadRequestException(`Product "${product.name}" has no barcode.`);
      prepared.push({
        id: product.id,
        name: `${product.name}${variant ? ` - ${variant.size} / ${variant.color}` : ""}`,
        barcode,
        sellingPrice: Number(variant?.sellingPrice ?? product.sellingPrice),
        copies: dto.copies ?? 1,
      });
    }

    const settings =
      (await this.prisma.barcodeLabelSettings.findUnique({ where: { storeId } })) ??
      (await this.prisma.barcodeLabelSettings.create({ data: { storeId } }));

    return {
      settings: {
        ...settings,
        marginTop: settings.marginTop === null ? null : Number(settings.marginTop),
        marginRight: settings.marginRight === null ? null : Number(settings.marginRight),
        marginBottom: settings.marginBottom === null ? null : Number(settings.marginBottom),
        marginLeft: settings.marginLeft === null ? null : Number(settings.marginLeft),
      },
      products: prepared,
    };
  }

  private requireStore(user: AuthenticatedUser) {
    if (user.isSuperAdmin || !user.storeId) {
      throw new ForbiddenException("Store product CRUD requires a store user context.");
    }
    return user.storeId;
  }

  private async prepareProductData(storeId: string, dto: CreateProductDto | UpdateProductDto) {
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
      brand: dto.brand === null ? null : dto.brand?.trim(),
      gender: dto.gender ?? undefined,
      season: dto.season ?? undefined,
      barcode: this.cleanOptional(dto.barcode),
      sku: this.cleanOptional(dto.sku),
      description: dto.description === null ? null : dto.description?.trim(),
      imageUrl: dto.imageUrl === null ? null : dto.imageUrl?.trim(),
      unitType: dto.unitType === null ? null : dto.unitType?.trim(),
      expiryDate: dto.expiryDate === null ? null : dto.expiryDate ? new Date(dto.expiryDate) : undefined,
      status: (dto as { status?: CatalogStatus }).status,
    };
  }

  private normalizeVariants(
    dto: CreateProductDto | UpdateProductDto,
    data: { sku?: string | null; barcode?: string | null; purchasePrice?: number; sellingPrice?: number; minStock?: number; stockQuantity?: number },
    existing?: ProductRecord,
  ) {
    const rawVariants = dto.variants ?? [];
    if (rawVariants.length > 0) {
      this.ensureUniqueVariantPayload(rawVariants as Array<{ sku?: string | null; barcode?: string | null }>);
      return rawVariants.map((variant) => this.normalizeVariant(variant));
    }

    if (existing?.variants?.length) {
      return existing.variants.map((variant) => ({
        size: variant.size,
        color: variant.color,
        sku: variant.sku,
        barcode: variant.barcode,
        costPrice: variant.costPrice,
        sellingPrice: variant.sellingPrice,
        discountPrice: variant.discountPrice,
        stockQuantity: variant.stockQuantity,
        minStock: variant.minStock,
        status: variant.status,
      }));
    }

    return [
      {
        size: "One Size",
        color: "Mixed",
        sku: data.sku ?? null,
        barcode: data.barcode ?? null,
        costPrice: new Prisma.Decimal(dto.purchasePrice ?? 0),
        sellingPrice: new Prisma.Decimal(dto.sellingPrice ?? 0),
        discountPrice: null,
        stockQuantity: dto.stockQuantity ?? 0,
        minStock: dto.minStock ?? 0,
        status: CatalogStatus.ACTIVE,
      },
    ];
  }

  private normalizeVariant(variant: PrismaProductVariant | { size: string; color: string; sku?: string | null; barcode?: string | null; costPrice: number; sellingPrice: number; discountPrice?: number | null; stockQuantity: number; minStock: number; status?: CatalogStatus }) {
    return {
      size: variant.size.trim(),
      color: variant.color.trim(),
      sku: this.cleanOptional(variant.sku ?? null),
      barcode: this.cleanOptional(variant.barcode ?? null),
      costPrice: new Prisma.Decimal(variant.costPrice),
      sellingPrice: new Prisma.Decimal(variant.sellingPrice),
      discountPrice: variant.discountPrice === undefined || variant.discountPrice === null ? null : new Prisma.Decimal(variant.discountPrice),
      stockQuantity: Number(variant.stockQuantity),
      minStock: Number(variant.minStock),
      status: variant.status ?? CatalogStatus.ACTIVE,
    };
  }

  private async ensureProductIdentifiers(storeId: string, barcode?: string | null, sku?: string | null, excludeId?: string) {
    if (barcode) {
      const existing = await this.prisma.product.findFirst({ where: { storeId, barcode, id: excludeId ? { not: excludeId } : undefined } });
      if (existing) throw new ConflictException("Barcode already exists in this store.");
    }
    if (sku) {
      const existing = await this.prisma.product.findFirst({ where: { storeId, sku, id: excludeId ? { not: excludeId } : undefined } });
      if (existing) throw new ConflictException("SKU already exists in this store.");
    }
  }

  private async ensureVariantIdentifiers(storeId: string, variants: Array<{ sku?: string | null; barcode?: string | null }>, existingVariants: Array<Pick<PrismaProductVariant, "id" | "sku" | "barcode">> = []) {
    const uniqueErrors: string[] = [];
    const skuValues = variants.map((variant) => variant.sku).filter((value): value is string => Boolean(value));
    const barcodeValues = variants.map((variant) => variant.barcode).filter((value): value is string => Boolean(value));
    const duplicateSku = findDuplicate(skuValues);
    const duplicateBarcode = findDuplicate(barcodeValues);
    if (duplicateSku) uniqueErrors.push(`Variant SKU "${duplicateSku}" is duplicated in this payload.`);
    if (duplicateBarcode) uniqueErrors.push(`Variant barcode "${duplicateBarcode}" is duplicated in this payload.`);
    const existingIds = existingVariants.map((variant) => variant.id);
    const [skuConflict, barcodeConflict] = await Promise.all([
      skuValues.length
        ? this.prisma.productVariant.findFirst({ where: { storeId, sku: { in: skuValues }, id: existingIds.length ? { notIn: existingIds } : undefined } })
        : Promise.resolve(null),
      barcodeValues.length
        ? this.prisma.productVariant.findFirst({ where: { storeId, barcode: { in: barcodeValues }, id: existingIds.length ? { notIn: existingIds } : undefined } })
        : Promise.resolve(null),
    ]);
    if (skuConflict) uniqueErrors.push("Variant SKU already exists in this store.");
    if (barcodeConflict) uniqueErrors.push("Variant barcode already exists in this store.");
    if (uniqueErrors.length) throw new ConflictException(uniqueErrors.join(" "));
  }

  private ensureUniqueVariantPayload(variants: Array<{ sku?: string | null; barcode?: string | null }>) {
    const uniqueErrors: string[] = [];
    const skuValues = variants.map((variant) => variant.sku).filter((value): value is string => Boolean(value));
    const barcodeValues = variants.map((variant) => variant.barcode).filter((value): value is string => Boolean(value));
    const duplicateSku = findDuplicate(skuValues);
    const duplicateBarcode = findDuplicate(barcodeValues);
    if (duplicateSku) uniqueErrors.push(`Variant SKU "${duplicateSku}" is duplicated in this payload.`);
    if (duplicateBarcode) uniqueErrors.push(`Variant barcode "${duplicateBarcode}" is duplicated in this payload.`);
    if (uniqueErrors.length) throw new ConflictException(uniqueErrors.join(" "));
  }

  private async generateUniqueBarcode(storeId: string) {
    for (let attempt = 0; attempt < 12; attempt += 1) {
      const body = `${Date.now()}${Math.floor(Math.random() * 1000).toString().padStart(3, "0")}`.slice(-12);
      const checkDigit = this.ean13CheckDigit(body);
      const barcode = `${body}${checkDigit}`;
      const existing = await this.prisma.productVariant.findFirst({ where: { storeId, barcode } });
      if (!existing) return barcode;
    }
    throw new ConflictException("Could not generate a unique barcode. Please try again.");
  }

  private ean13CheckDigit(body: string) {
    const sum = body.split("").reduce((total, char, index) => {
      const digit = Number(char);
      return total + digit * (index % 2 === 0 ? 1 : 3);
    }, 0);
    return (10 - (sum % 10)) % 10;
  }

  private cleanOptional(value?: string | null) {
    const cleaned = value?.trim();
    return cleaned ? cleaned : value === null ? null : undefined;
  }

  private serialize(product: ProductRecord) {
    const variants = product.variants.map((variant) => this.serializeVariant(variant));
    const primaryVariant = variants[0] ?? null;
    return {
      ...product,
      purchasePrice: Number(product.purchasePrice),
      sellingPrice: Number(product.sellingPrice),
      minStock: product.minStock,
      variants,
      barcode: primaryVariant?.barcode ?? product.barcode,
      sku: primaryVariant?.sku ?? product.sku,
      profitMargin: primaryVariant ? this.calculateMargin(primaryVariant.costPrice, primaryVariant.sellingPrice) : this.calculateMargin(Number(product.purchasePrice), Number(product.sellingPrice)),
    };
  }

  private serializeVariant(variant: PrismaProductVariant) {
    return {
      ...variant,
      costPrice: Number(variant.costPrice),
      sellingPrice: Number(variant.sellingPrice),
      discountPrice: variant.discountPrice === null ? null : Number(variant.discountPrice),
    };
  }

  private calculateMargin(cost: number, selling: number) {
    if (cost <= 0) return 0;
    return Number((((selling - cost) / cost) * 100).toFixed(2));
  }

  private async log(user: AuthenticatedUser, action: string, entityId: string, metadata: Record<string, unknown>) {
    await this.activityLogs.log({
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

function findDuplicate(values: string[]) {
  const seen = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) return value;
    seen.add(value);
  }
  return null;
}
