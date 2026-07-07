import { BadRequestException, Controller, Get, Param, Post, Query, Res, UploadedFile, UseGuards, UseInterceptors } from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { memoryStorage } from "multer";
import type { Response } from "express";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { RequirePermissions } from "../../common/decorators/require-permissions.decorator";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../common/guards/permissions.guard";
import type { AuthenticatedUser } from "../../common/utils/auth.types";
import { ExportInvoicesQueryDto, ExportQueryDto, ExportReportsQueryDto, ImportInitialStockQueryDto, ImportProductsQueryDto } from "./dto/import-export.dto";
import { ImportExportService } from "./import-export.service";

const uploadMaxMb = Number(process.env.UPLOAD_MAX_MB ?? 10);

const uploadInterceptor = FileInterceptor("file", {
  storage: memoryStorage(),
  limits: { fileSize: uploadMaxMb * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    const name = file.originalname.toLowerCase();
    if (!name.endsWith(".xlsx") && !name.endsWith(".csv")) {
      return callback(new BadRequestException("Only .xlsx and .csv files are supported."), false);
    }
    callback(null, true);
  },
});

@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("import-export")
export class ImportExportController {
  constructor(private readonly importExportService: ImportExportService) {}

  @RequirePermissions("products.import")
  @Get("templates/products.:format")
  productTemplate(@Param("format") format: string, @Res() res: Response) {
    return this.send(res, this.importExportService.productTemplate(format));
  }

  @RequirePermissions("inventory.import")
  @Get("templates/initial-stock.:format")
  stockTemplate(@Param("format") format: string, @Res() res: Response) {
    return this.send(res, this.importExportService.initialStockTemplate(format));
  }

  @RequirePermissions("products.import")
  @UseInterceptors(uploadInterceptor)
  @Post("products/preview")
  previewProducts(@CurrentUser() user: AuthenticatedUser, @UploadedFile() file: Express.Multer.File, @Query() query: ImportProductsQueryDto) {
    return this.importExportService.previewProducts(user, file, query.mode);
  }

  @RequirePermissions("products.import")
  @UseInterceptors(uploadInterceptor)
  @Post("products/import")
  importProducts(@CurrentUser() user: AuthenticatedUser, @UploadedFile() file: Express.Multer.File, @Query() query: ImportProductsQueryDto) {
    return this.importExportService.importProducts(user, file, query.mode);
  }

  @RequirePermissions("inventory.import")
  @UseInterceptors(uploadInterceptor)
  @Post("initial-stock/preview")
  previewInitialStock(@CurrentUser() user: AuthenticatedUser, @UploadedFile() file: Express.Multer.File, @Query() query: ImportInitialStockQueryDto) {
    return this.importExportService.previewInitialStock(user, file, query.mode);
  }

  @RequirePermissions("inventory.import")
  @UseInterceptors(uploadInterceptor)
  @Post("initial-stock/import")
  importInitialStock(@CurrentUser() user: AuthenticatedUser, @UploadedFile() file: Express.Multer.File, @Query() query: ImportInitialStockQueryDto) {
    return this.importExportService.importInitialStock(user, file, query.mode);
  }

  @RequirePermissions("products.export")
  @Get("products")
  exportProducts(@CurrentUser() user: AuthenticatedUser, @Query() query: ExportQueryDto, @Res() res: Response) {
    return this.send(res, this.importExportService.exportProducts(user, query));
  }

  @RequirePermissions("inventory.export")
  @Get("inventory")
  exportInventory(@CurrentUser() user: AuthenticatedUser, @Query() query: ExportQueryDto, @Res() res: Response) {
    return this.send(res, this.importExportService.exportInventory(user, query));
  }

  @RequirePermissions("data.export")
  @Get("invoices")
  exportInvoices(@CurrentUser() user: AuthenticatedUser, @Query() query: ExportInvoicesQueryDto, @Res() res: Response) {
    return this.send(res, this.importExportService.exportInvoices(user, query));
  }

  @RequirePermissions("data.export")
  @Get("expenses")
  exportExpenses(@CurrentUser() user: AuthenticatedUser, @Query() query: ExportInvoicesQueryDto, @Res() res: Response) {
    return this.send(res, this.importExportService.exportExpenses(user, query));
  }

  @RequirePermissions("data.export")
  @Get("customers")
  exportCustomers(@CurrentUser() user: AuthenticatedUser, @Query() query: ExportQueryDto, @Res() res: Response) {
    return this.send(res, this.importExportService.exportCustomers(user, query));
  }

  @RequirePermissions("data.export")
  @Get("suppliers")
  exportSuppliers(@CurrentUser() user: AuthenticatedUser, @Query() query: ExportQueryDto, @Res() res: Response) {
    return this.send(res, this.importExportService.exportSuppliers(user, query));
  }

  @RequirePermissions("reports.export")
  @Get("reports/daily-sales")
  exportDailySales(@CurrentUser() user: AuthenticatedUser, @Query() query: ExportReportsQueryDto, @Res() res: Response) {
    return this.send(res, this.importExportService.exportDailySales(user, query));
  }

  @RequirePermissions("reports.export")
  @Get("reports/profit")
  exportProfit(@CurrentUser() user: AuthenticatedUser, @Query() query: ExportReportsQueryDto, @Res() res: Response) {
    return this.send(res, this.importExportService.exportProfit(user, query));
  }

  @RequirePermissions("reports.export")
  @Get("reports/inventory-value")
  exportInventoryValue(@CurrentUser() user: AuthenticatedUser, @Query() query: ExportReportsQueryDto, @Res() res: Response) {
    return this.send(res, this.importExportService.exportInventoryValue(user, query));
  }

  private async send(res: Response, resultPromise: Promise<{ buffer: Buffer; filename: string; contentType: string }>) {
    const result = await resultPromise;
    res.setHeader("Content-Type", result.contentType);
    res.setHeader("Content-Disposition", `attachment; filename="${result.filename}"`);
    return res.send(result.buffer);
  }
}
