import { BadRequestException, ForbiddenException, Injectable } from "@nestjs/common";
import { CatalogStatus, InventoryMovementType, Prisma } from "@prisma/client";
import ExcelJS from "exceljs";
import { parse as parseCsv } from "csv-parse/sync";
import { PrismaService } from "../../prisma/prisma.service";
import type { AuthenticatedUser } from "../../common/utils/auth.types";
import { ActivityLogsService } from "../activity-logs/activity-logs.service";
import { ExportFormat, ExportInvoicesQueryDto, ExportQueryDto, ExportReportsQueryDto, ProductImportMode, StockImportMode } from "./dto/import-export.dto";

const maxRows = 5000;
const productHeaders = ["name", "اسم المنتج", "barcode", "الباركود", "sku", "SKU", "category", "التصنيف", "purchasePrice", "سعر الشراء", "sellingPrice", "سعر البيع", "minStock", "الحد الأدنى", "unitType", "الوحدة", "expiryDate", "تاريخ الصلاحية", "description", "الوصف", "status", "الحالة"];
const stockHeaders = ["productIdentifier", "معرف المنتج", "quantity", "الكمية", "branchName", "اسم الفرع", "branchId", "معرف الفرع", "batchNumber", "رقم التشغيلة", "expiryDate", "تاريخ الصلاحية", "purchasePrice", "سعر الشراء", "notes", "ملاحظات"];

type ImportIssue = { row: number; field: string; message: string };
type ParsedRow = Record<string, unknown> & { __rowNumber: number };
type ProductRow = {
  row: number;
  name: string;
  sellingPrice: number;
  barcode?: string | null;
  sku?: string | null;
  category?: string | null;
  purchasePrice: number;
  minStock: number;
  unitType: string;
  expiryDate?: Date | null;
  description?: string | null;
  status: CatalogStatus;
  existingProductId?: string;
};
type StockRow = {
  row: number;
  productId: string;
  productName: string;
  branchId: string;
  branchName: string;
  quantity: number;
  batchNumber?: string | null;
  expiryDate?: Date | null;
  purchasePrice?: number | null;
  notes?: string | null;
};

@Injectable()
export class ImportExportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activityLogs: ActivityLogsService,
  ) {}

  async productTemplate(format: string) {
    return this.buildFile(format, "products-template", [productHeaders], []);
  }

  async initialStockTemplate(format: string) {
    return this.buildFile(format, "initial-stock-template", [stockHeaders], []);
  }

  async previewProducts(user: AuthenticatedUser, file: Express.Multer.File, mode = ProductImportMode.UPSERT) {
    const storeId = this.requireStore(user);
    const rows = await this.parseUpload(file);
    const parsed = await this.validateProductRows(storeId, rows, mode);
    await this.log(user, "import.products_previewed", undefined, { rows: rows.length, errors: parsed.errors.length });
    return this.previewSummary(rows.length, parsed.validRows, parsed.errors, parsed.warnings, parsed.createCount, parsed.updateCount);
  }

  async importProducts(user: AuthenticatedUser, file: Express.Multer.File, mode = ProductImportMode.UPSERT) {
    const storeId = this.requireStore(user);
    const rows = await this.parseUpload(file);
    const parsed = await this.validateProductRows(storeId, rows, mode);
    if (parsed.errors.length) return { created: 0, updated: 0, skipped: parsed.errors.length, errors: parsed.errors };

    const summary = await this.prisma.$transaction(async (tx) => {
      let created = 0;
      let updated = 0;
      const categoryCache = new Map<string, string>();
      for (const row of parsed.validRows) {
        let categoryId: string | null = null;
        if (row.category) {
          const categoryKey = row.category.trim().toLowerCase();
          categoryId = categoryCache.get(categoryKey) ?? null;
          if (!categoryId) {
            const category = await tx.category.upsert({
              where: { storeId_name: { storeId, name: row.category } },
              update: { status: "ACTIVE" },
              create: { storeId, name: row.category, status: "ACTIVE" },
            });
            categoryId = category.id;
            categoryCache.set(categoryKey, category.id);
          }
        }
        const data = {
          name: row.name,
          barcode: row.barcode,
          sku: row.sku,
          categoryId,
          purchasePrice: new Prisma.Decimal(row.purchasePrice),
          sellingPrice: new Prisma.Decimal(row.sellingPrice),
          minStock: row.minStock,
          unitType: row.unitType,
          expiryDate: row.expiryDate,
          description: row.description,
          status: row.status,
        };
        if (row.existingProductId) {
          await tx.product.update({ where: { id: row.existingProductId }, data });
          updated += 1;
        } else {
          await tx.product.create({ data: { storeId, ...data } });
          created += 1;
        }
      }
      return { created, updated, skipped: 0, errors: [] as ImportIssue[] };
    });
    await this.log(user, "import.products_imported", undefined, { rows: rows.length, created: summary.created, updated: summary.updated, errors: 0 });
    return summary;
  }

  async previewInitialStock(user: AuthenticatedUser, file: Express.Multer.File, mode = StockImportMode.ADD_TO_EXISTING) {
    const storeId = this.requireStore(user);
    const rows = await this.parseUpload(file);
    const parsed = await this.validateStockRows(storeId, rows);
    await this.log(user, "import.initial_stock_previewed", undefined, { rows: rows.length, errors: parsed.errors.length, mode });
    return this.previewSummary(rows.length, parsed.validRows, parsed.errors, parsed.warnings, parsed.validRows.length, 0);
  }

  async importInitialStock(user: AuthenticatedUser, file: Express.Multer.File, mode = StockImportMode.ADD_TO_EXISTING) {
    const storeId = this.requireStore(user);
    const rows = await this.parseUpload(file);
    const parsed = await this.validateStockRows(storeId, rows);
    if (parsed.errors.length) return { created: 0, updated: 0, skipped: parsed.errors.length, errors: parsed.errors };

    const summary = await this.prisma.$transaction(async (tx) => {
      let updated = 0;
      for (const row of parsed.validRows) {
        const quantity = new Prisma.Decimal(row.quantity);
        const existing = await tx.inventoryStock.upsert({
          where: { storeId_branchId_productId: { storeId, branchId: row.branchId, productId: row.productId } },
          update: {},
          create: { storeId, branchId: row.branchId, productId: row.productId, quantity: 0 },
        });
        const before = existing.quantity;
        const after = mode === StockImportMode.SET_INITIAL_QUANTITY ? quantity : before.plus(quantity);
        const diff = after.minus(before);
        if (diff.equals(0)) continue;
        await tx.inventoryStock.update({ where: { id: existing.id }, data: { quantity: after } });
        await tx.inventoryMovement.create({
          data: {
            storeId,
            branchId: row.branchId,
            productId: row.productId,
            userId: user.id,
            type: mode === StockImportMode.ADD_TO_EXISTING ? InventoryMovementType.ADD_STOCK : diff.greaterThan(0) ? InventoryMovementType.ADJUSTMENT_IN : InventoryMovementType.ADJUSTMENT_OUT,
            quantity: diff.abs(),
            quantityBefore: before,
            quantityAfter: after,
            reason: "Imported initial stock",
            notes: row.notes,
          },
        });
        if (row.batchNumber || row.expiryDate || row.purchasePrice !== undefined) {
          await tx.inventoryBatch.create({
            data: {
              storeId,
              branchId: row.branchId,
              productId: row.productId,
              batchNumber: row.batchNumber,
              expiryDate: row.expiryDate,
              purchasePrice: row.purchasePrice !== undefined && row.purchasePrice !== null ? new Prisma.Decimal(row.purchasePrice) : undefined,
              quantity: diff.abs(),
              remainingQuantity: diff.abs(),
            },
          });
        }
        updated += 1;
      }
      return { created: 0, updated, skipped: 0, errors: [] as ImportIssue[] };
    });
    await this.log(user, "import.initial_stock_imported", undefined, { rows: rows.length, updated: summary.updated, errors: 0, mode });
    return summary;
  }

  async exportProducts(user: AuthenticatedUser, query: ExportQueryDto) {
    const storeId = this.requireStore(user);
    const products = await this.prisma.product.findMany({
      where: {
        storeId,
        categoryId: query.categoryId || undefined,
        status: query.status as CatalogStatus | undefined,
        OR: query.search?.trim() ? [{ name: { contains: query.search.trim(), mode: "insensitive" } }, { barcode: { contains: query.search.trim(), mode: "insensitive" } }, { sku: { contains: query.search.trim(), mode: "insensitive" } }] : undefined,
      },
      include: { category: true },
      orderBy: { createdAt: "desc" },
    });
    await this.log(user, "export.products", undefined, { format: this.format(query), rows: products.length });
    return this.buildFile(this.format(query), "products", [[
      "Product name", "Barcode", "SKU", "Category", "Purchase price", "Selling price", "Profit margin", "Min stock", "Unit type", "Status", "Created at",
    ]], products.map((product) => {
      const purchase = Number(product.purchasePrice);
      const selling = Number(product.sellingPrice);
      return [product.name, product.barcode, product.sku, product.category?.name, purchase, selling, selling ? round(((selling - purchase) / selling) * 100) : 0, product.minStock, product.unitType, product.status, product.createdAt.toISOString()];
    }));
  }

  async exportInventory(user: AuthenticatedUser, query: ExportQueryDto) {
    const storeId = this.requireStore(user);
    const branchId = await this.optionalBranch(storeId, query.branchId);
    const stocks = await this.prisma.inventoryStock.findMany({ where: { storeId, branchId: branchId || undefined }, include: { product: { include: { category: true } }, branch: true }, orderBy: { updatedAt: "desc" } });
    const rows = await Promise.all(stocks.map(async (stock) => {
      const last = await this.prisma.inventoryMovement.findFirst({ where: { storeId, branchId: stock.branchId, productId: stock.productId }, orderBy: { createdAt: "desc" } });
      const quantity = Number(stock.quantity);
      const min = Number(stock.minStockOverride ?? stock.product.minStock);
      const status = quantity <= 0 ? "out_of_stock" : quantity <= min ? "low_stock" : "in_stock";
      return [stock.product.name, stock.product.barcode, stock.product.category?.name, stock.branch.name, quantity, min, status, last?.createdAt.toISOString() ?? ""];
    }));
    const filtered = query.status ? rows.filter((row) => row[6] === query.status) : rows;
    await this.log(user, "export.inventory", branchId ?? undefined, { format: this.format(query), rows: filtered.length });
    return this.buildFile(this.format(query), "inventory", [["Product name", "Barcode", "Category", "Branch", "Current quantity", "Min stock", "Stock status", "Last movement date"]], filtered);
  }

  async exportInvoices(user: AuthenticatedUser, query: ExportInvoicesQueryDto) {
    const storeId = this.requireStore(user);
    const branchId = await this.optionalBranch(storeId, query.branchId);
    const invoices = await this.prisma.invoice.findMany({
      where: { storeId, branchId: branchId || undefined, cashierId: query.cashierId || undefined, status: query.status as never, createdAt: dateRange(query) },
      include: { branch: true, cashier: true, customer: true, payments: true },
      orderBy: { createdAt: "desc" },
    });
    await this.log(user, "export.invoices", branchId ?? undefined, { format: this.format(query), rows: invoices.length });
    return this.buildFile(this.format(query), "invoices", [["Invoice number", "Date", "Branch", "Cashier", "Customer", "Status", "Subtotal", "Discount", "Tax", "Total", "Paid amount", "Payment methods"]], invoices.map((invoice) => [invoice.invoiceNumber, invoice.createdAt.toISOString(), invoice.branch.name, invoice.cashier.name, invoice.customer?.name ?? "", invoice.status, Number(invoice.subtotal), Number(invoice.discountTotal), Number(invoice.taxTotal), Number(invoice.total), Number(invoice.paidAmount), invoice.payments.map((payment) => payment.method).join(" + ")]));
  }

  async exportExpenses(user: AuthenticatedUser, query: ExportInvoicesQueryDto) {
    const storeId = this.requireStore(user);
    const branchId = await this.optionalBranch(storeId, query.branchId);
    const expenses = await this.prisma.expense.findMany({ where: { storeId, branchId: branchId || undefined, deletedAt: null, expenseDate: dateRange(query) }, include: { branch: true, user: true }, orderBy: { expenseDate: "desc" } });
    await this.log(user, "export.expenses", branchId ?? undefined, { format: this.format(query), rows: expenses.length });
    return this.buildFile(this.format(query), "expenses", [["Title", "Category", "Amount", "Branch", "Date", "Added by", "Notes"]], expenses.map((expense) => [expense.title, expense.category, Number(expense.amount), expense.branch.name, expense.expenseDate.toISOString(), expense.user.name, expense.notes ?? ""]));
  }

  async exportCustomers(user: AuthenticatedUser, query: ExportQueryDto) {
    const storeId = this.requireStore(user);
    const customers = await this.prisma.customer.findMany({ where: { storeId, status: query.status as never, deletedAt: null }, orderBy: { createdAt: "desc" } });
    await this.log(user, "export.customers", undefined, { format: this.format(query), rows: customers.length });
    return this.buildFile(this.format(query), "customers", [["Name", "Phone", "Current debt", "Credit limit", "Status", "Created at"]], customers.map((customer) => [customer.name, customer.phone, Number(customer.currentDebt), customer.creditLimit === null ? "" : Number(customer.creditLimit), customer.status, customer.createdAt.toISOString()]));
  }

  async exportSuppliers(user: AuthenticatedUser, query: ExportQueryDto) {
    const storeId = this.requireStore(user);
    const suppliers = await this.prisma.supplier.findMany({ where: { storeId, status: query.status as never, deletedAt: null }, orderBy: { createdAt: "desc" } });
    await this.log(user, "export.suppliers", undefined, { format: this.format(query), rows: suppliers.length });
    return this.buildFile(this.format(query), "suppliers", [["Name", "Phone", "Contact person", "Current balance", "Status", "Created at"]], suppliers.map((supplier) => [supplier.name, supplier.phone, supplier.contactPerson, Number(supplier.currentBalance), supplier.status, supplier.createdAt.toISOString()]));
  }

  async exportDailySales(user: AuthenticatedUser, query: ExportReportsQueryDto) {
    const storeId = this.requireStore(user);
    const branchId = await this.optionalBranch(storeId, query.branchId);
    const invoices = await this.prisma.invoice.findMany({ where: { storeId, branchId: branchId || undefined, createdAt: dateRange(query) }, select: { createdAt: true, total: true, status: true } });
    const map = new Map<string, { date: string; invoicesCount: number; totalSales: number; returns: number; netSales: number }>();
    for (const invoice of invoices) {
      const key = dateKey(invoice.createdAt);
      const row = map.get(key) ?? { date: key, invoicesCount: 0, totalSales: 0, returns: 0, netSales: 0 };
      row.invoicesCount += 1;
      row.totalSales += Number(invoice.total);
      if (invoice.status === "REFUNDED" || invoice.status === "PARTIALLY_REFUNDED") row.returns += Number(invoice.total);
      row.netSales = row.totalSales - row.returns;
      map.set(key, row);
    }
    const rows = Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
    await this.log(user, "export.report.daily_sales", branchId ?? undefined, { format: this.format(query), rows: rows.length });
    return this.buildFile(this.format(query), "daily-sales-report", [["Date", "Invoices count", "Total sales", "Returns", "Net sales"]], rows.map((row) => [row.date, row.invoicesCount, round(row.totalSales), round(row.returns), round(row.netSales)]));
  }

  async exportProfit(user: AuthenticatedUser, query: ExportReportsQueryDto) {
    const storeId = this.requireStore(user);
    const branchId = await this.optionalBranch(storeId, query.branchId);
    const items = await this.prisma.invoiceItem.findMany({ where: { storeId, branchId: branchId || undefined, invoice: { createdAt: dateRange(query) } }, select: { lineTotal: true, purchasePriceSnapshot: true, quantity: true, returnedQuantity: true, discount: true, unitPrice: true } });
    const expenses = await this.prisma.expense.aggregate({ where: { storeId, branchId: branchId || undefined, deletedAt: null, expenseDate: dateRange(query) }, _sum: { amount: true } });
    const sales = items.reduce((sum, item) => sum + Number(item.lineTotal), 0);
    const estimatedProfit = items.reduce((sum, item) => sum + (Number(item.unitPrice) - Number(item.purchasePriceSnapshot ?? 0)) * Math.max(Number(item.quantity) - Number(item.returnedQuantity), 0) - Number(item.discount ?? 0), 0);
    const expenseTotal = Number(expenses._sum.amount ?? 0);
    await this.log(user, "export.report.profit", branchId ?? undefined, { format: this.format(query), rows: 1 });
    return this.buildFile(this.format(query), "profit-report", [["Period", "Sales", "Estimated profit", "Expenses", "Net estimate"]], [[periodLabel(query), round(sales), round(estimatedProfit), round(expenseTotal), round(estimatedProfit - expenseTotal)]]);
  }

  async exportInventoryValue(user: AuthenticatedUser, query: ExportReportsQueryDto) {
    const storeId = this.requireStore(user);
    const branchId = await this.optionalBranch(storeId, query.branchId);
    const stocks = await this.prisma.inventoryStock.findMany({ where: { storeId, branchId: branchId || undefined }, include: { product: true, branch: true } });
    await this.log(user, "export.report.inventory_value", branchId ?? undefined, { format: this.format(query), rows: stocks.length });
    return this.buildFile(this.format(query), "inventory-value-report", [["Product", "Branch", "Quantity", "Purchase price", "Inventory value"]], stocks.map((stock) => {
      const quantity = Number(stock.quantity);
      const purchase = Number(stock.product.purchasePrice);
      return [stock.product.name, stock.branch.name, quantity, purchase, round(quantity * purchase)];
    }));
  }

  private async validateProductRows(storeId: string, rows: ParsedRow[], mode: ProductImportMode) {
    const errors: ImportIssue[] = [];
    const warnings: ImportIssue[] = [];
    const validRows: ProductRow[] = [];
    for (const row of rows) {
      const rowNo = row.__rowNumber;
      const name = text(value(row, ["name", "اسم المنتج"]));
      const sellingPrice = number(value(row, ["sellingPrice", "سعر البيع"]));
      const purchasePrice = number(value(row, ["purchasePrice", "سعر الشراء"])) ?? 0;
      const minStock = number(value(row, ["minStock", "الحد الأدنى"])) ?? 0;
      if (!name) errors.push({ row: rowNo, field: "name", message: "Product name is required." });
      if (sellingPrice === undefined) errors.push({ row: rowNo, field: "sellingPrice", message: "Selling price is required." });
      if (sellingPrice !== undefined && sellingPrice < 0) errors.push({ row: rowNo, field: "sellingPrice", message: "Selling price cannot be negative." });
      if (purchasePrice < 0) errors.push({ row: rowNo, field: "purchasePrice", message: "Purchase price cannot be negative." });
      if (minStock < 0) errors.push({ row: rowNo, field: "minStock", message: "Minimum stock cannot be negative." });
      const expiryDate = parseDate(value(row, ["expiryDate", "تاريخ الصلاحية"]));
      if (expiryDate === false) errors.push({ row: rowNo, field: "expiryDate", message: "Invalid expiry date." });
      const barcode = text(value(row, ["barcode", "الباركود"])) || null;
      const sku = text(value(row, ["sku", "SKU"])) || null;
      const existing = await this.findExistingProduct(storeId, barcode, sku);
      if (existing && mode === ProductImportMode.CREATE_ONLY) errors.push({ row: rowNo, field: "barcode/sku", message: "Product already exists in this store." });
      const category = text(value(row, ["category", "التصنيف"])) || null;
      if (category) warnings.push({ row: rowNo, field: "category", message: "Missing categories will be created automatically." });
      const hasRowError = errors.some((error) => error.row === rowNo);
      if (!hasRowError && name && sellingPrice !== undefined) {
        validRows.push({
          row: rowNo,
          name,
          sellingPrice,
          purchasePrice,
          minStock,
          barcode,
          sku,
          category,
          unitType: text(value(row, ["unitType", "الوحدة"])) || "قطعة",
          expiryDate: expiryDate || null,
          description: text(value(row, ["description", "الوصف"])) || null,
          status: normalizeStatus(value(row, ["status", "الحالة"])),
          existingProductId: existing?.id,
        });
      }
    }
    return { validRows, errors, warnings, createCount: validRows.filter((row) => !row.existingProductId).length, updateCount: validRows.filter((row) => row.existingProductId).length };
  }

  private async validateStockRows(storeId: string, rows: ParsedRow[]) {
    const errors: ImportIssue[] = [];
    const warnings: ImportIssue[] = [];
    const validRows: StockRow[] = [];
    for (const row of rows) {
      const rowNo = row.__rowNumber;
      const identifier = text(value(row, ["productIdentifier", "معرف المنتج"]));
      const quantity = number(value(row, ["quantity", "الكمية"]));
      const branchIdRaw = text(value(row, ["branchId", "معرف الفرع"]));
      const branchName = text(value(row, ["branchName", "اسم الفرع"]));
      if (!identifier) errors.push({ row: rowNo, field: "productIdentifier", message: "Product identifier is required." });
      if (quantity === undefined || quantity <= 0) errors.push({ row: rowNo, field: "quantity", message: "Quantity must be greater than zero." });
      const product = identifier ? await this.findProductByIdentifier(storeId, identifier) : null;
      if (identifier && !product) errors.push({ row: rowNo, field: "productIdentifier", message: "Product was not found in this store." });
      const branch = await this.findBranch(storeId, branchIdRaw, branchName);
      if (!branch) errors.push({ row: rowNo, field: "branch", message: "Branch does not belong to this store." });
      const expiryDate = parseDate(value(row, ["expiryDate", "تاريخ الصلاحية"]));
      if (expiryDate === false) errors.push({ row: rowNo, field: "expiryDate", message: "Invalid expiry date." });
      const purchasePrice = number(value(row, ["purchasePrice", "سعر الشراء"]));
      if (purchasePrice !== undefined && purchasePrice < 0) errors.push({ row: rowNo, field: "purchasePrice", message: "Purchase price cannot be negative." });
      const hasRowError = errors.some((error) => error.row === rowNo);
      if (!hasRowError && product && branch && quantity !== undefined) {
        validRows.push({ row: rowNo, productId: product.id, productName: product.name, branchId: branch.id, branchName: branch.name, quantity, batchNumber: text(value(row, ["batchNumber", "رقم التشغيلة"])) || null, expiryDate: expiryDate || null, purchasePrice, notes: text(value(row, ["notes", "ملاحظات"])) || null });
      }
    }
    return { validRows, errors, warnings };
  }

  private previewSummary(totalRows: number, validRows: unknown[], errors: ImportIssue[], warnings: ImportIssue[], createCount: number, updateCount: number) {
    return { totalRows, validRows: validRows.length, invalidRows: errors.length, createCount, updateCount, warnings, errors, sampleRows: validRows.slice(0, 5) };
  }

  private async parseUpload(file?: Express.Multer.File): Promise<ParsedRow[]> {
    if (!file) throw new BadRequestException("Upload file is required.");
    const name = file.originalname.toLowerCase();
    if (!name.endsWith(".xlsx") && !name.endsWith(".csv")) throw new BadRequestException("Only .xlsx and .csv files are supported.");
    const rows = name.endsWith(".xlsx") ? await this.parseXlsx(file.buffer) : this.parseCsv(file.buffer);
    if (rows.length > maxRows) throw new BadRequestException(`Import files are limited to ${maxRows} rows.`);
    return rows;
  }

  private async parseXlsx(buffer: Buffer): Promise<ParsedRow[]> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as unknown as ExcelJS.Buffer);
    const sheet = workbook.worksheets[0];
    if (!sheet) return [];
    const headers = sheet.getRow(1).values as unknown[];
    const names = headers.slice(1).map((item) => text(item));
    const rows: ParsedRow[] = [];
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      const parsed: ParsedRow = { __rowNumber: rowNumber };
      names.forEach((header, index) => {
        parsed[header] = normalizeCell(row.getCell(index + 1).value);
      });
      if (Object.keys(parsed).some((key) => key !== "__rowNumber" && text(parsed[key]))) rows.push(parsed);
    });
    return rows;
  }

  private parseCsv(buffer: Buffer): ParsedRow[] {
    const records = parseCsv(buffer, { columns: true, skip_empty_lines: true, trim: true, bom: true }) as Record<string, unknown>[];
    return records.map((record, index) => ({ __rowNumber: index + 2, ...record }));
  }

  private async buildFile(formatRaw: string, basename: string, headerRows: unknown[][], rows: unknown[][]) {
    const format = normalizeFormat(formatRaw);
    const filename = `${basename}.${format}`;
    if (format === ExportFormat.CSV) {
      const allRows = [...headerRows, ...rows];
      return { filename, contentType: "text/csv; charset=utf-8", buffer: Buffer.from("\uFEFF" + allRows.map((row) => row.map(csvCell).join(",")).join("\n")) };
    }
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Data");
    [...headerRows, ...rows].forEach((row) => sheet.addRow(row.map(safeCell)));
    sheet.columns.forEach((column) => {
      column.width = Math.min(Math.max(...(column.values ?? []).map((item) => String(item ?? "").length), 12), 42);
    });
    const buffer = Buffer.from(await workbook.xlsx.writeBuffer());
    return { filename, contentType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", buffer };
  }

  private async findExistingProduct(storeId: string, barcode?: string | null, sku?: string | null) {
    if (!barcode && !sku) return null;
    return this.prisma.product.findFirst({ where: { storeId, OR: [barcode ? { barcode } : {}, sku ? { sku } : {}].filter((item) => Object.keys(item).length > 0) } });
  }

  private async findProductByIdentifier(storeId: string, identifier: string) {
    return this.prisma.product.findFirst({ where: { storeId, OR: [{ barcode: identifier }, { sku: identifier }, { name: identifier }] } });
  }

  private findBranch(storeId: string, branchId?: string, branchName?: string) {
    if (branchId) return this.prisma.branch.findFirst({ where: { storeId, id: branchId } });
    if (branchName) return this.prisma.branch.findFirst({ where: { storeId, name: branchName } });
    return null;
  }

  private async optionalBranch(storeId: string, branchId?: string) {
    if (!branchId) return null;
    const branch = await this.prisma.branch.findFirst({ where: { storeId, id: branchId } });
    if (!branch) throw new BadRequestException("Branch does not belong to this store.");
    return branch.id;
  }

  private requireStore(user: AuthenticatedUser) {
    if (user.isSuperAdmin || !user.storeId) throw new ForbiddenException("Import/export requires a store user context.");
    return user.storeId;
  }

  private format(query: { format?: ExportFormat | string }) {
    return normalizeFormat(query.format ?? ExportFormat.XLSX);
  }

  private log(user: AuthenticatedUser, action: string, branchId?: string, metadata?: Record<string, unknown>) {
    return this.activityLogs.log({ storeId: user.storeId, branchId: branchId ?? user.branchId, userId: user.id, action, entityType: "ImportExport", metadata: metadata as Prisma.InputJsonObject });
  }
}

function normalizeFormat(format: string) {
  if (format !== ExportFormat.CSV && format !== ExportFormat.XLSX) throw new BadRequestException("Format must be xlsx or csv.");
  return format;
}

function value(row: ParsedRow, keys: string[]) {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null && String(row[key]).trim() !== "") return row[key];
  }
  return undefined;
}

function text(input: unknown) {
  if (input === undefined || input === null) return "";
  return String(input).trim();
}

function number(input: unknown) {
  if (input === undefined || input === null || text(input) === "") return undefined;
  const parsed = Number(input);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseDate(input: unknown): Date | false | null {
  if (input === undefined || input === null || text(input) === "") return null;
  if (input instanceof Date && !Number.isNaN(input.getTime())) return input;
  const date = new Date(String(input));
  return Number.isNaN(date.getTime()) ? false : date;
}

function normalizeStatus(input: unknown): CatalogStatus {
  const raw = text(input).toUpperCase();
  return raw === "INACTIVE" || raw === "غير نشط" ? "INACTIVE" : "ACTIVE";
}

function normalizeCell(value: ExcelJS.CellValue) {
  if (value instanceof Date) return value;
  if (value && typeof value === "object" && "text" in value) return value.text;
  if (value && typeof value === "object" && "result" in value) return value.result;
  return value;
}

function safeCell(value: unknown) {
  const stringValue = value === null || value === undefined ? "" : String(value);
  return /^[=+\-@]/.test(stringValue) ? `'${stringValue}` : value ?? "";
}

function csvCell(value: unknown) {
  const safe = String(safeCell(value));
  return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

function dateRange(query: { dateFrom?: string; dateTo?: string }) {
  return { gte: query.dateFrom ? new Date(query.dateFrom) : undefined, lte: query.dateTo ? endOfDay(new Date(query.dateTo)) : undefined };
}

function endOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59, 999);
}

function dateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function periodLabel(query: { dateFrom?: string; dateTo?: string }) {
  return `${query.dateFrom ?? "start"} to ${query.dateTo ?? "now"}`;
}

function round(value: number) {
  return Number(value.toFixed(2));
}
