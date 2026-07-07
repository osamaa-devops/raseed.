import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerModule } from "@nestjs/throttler";
import { APP_GUARD } from "@nestjs/core";
import { HealthModule } from "./modules/health/health.module";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./modules/auth/auth.module";
import { UsersModule } from "./modules/users/users.module";
import { StoresModule } from "./modules/stores/stores.module";
import { BranchesModule } from "./modules/branches/branches.module";
import { RolesModule } from "./modules/roles/roles.module";
import { PermissionsModule } from "./modules/permissions/permissions.module";
import { CategoriesModule } from "./modules/categories/categories.module";
import { ProductsModule } from "./modules/products/products.module";
import { InventoryModule } from "./modules/inventory/inventory.module";
import { ShiftsModule } from "./modules/shifts/shifts.module";
import { PosModule } from "./modules/pos/pos.module";
import { InvoicesModule } from "./modules/invoices/invoices.module";
import { ReturnsModule } from "./modules/returns/returns.module";
import { ExpensesModule } from "./modules/expenses/expenses.module";
import { DashboardModule } from "./modules/dashboard/dashboard.module";
import { ReportsModule } from "./modules/reports/reports.module";
import { ClosingModule } from "./modules/closing/closing.module";
import { CustomersModule } from "./modules/customers/customers.module";
import { SuppliersModule } from "./modules/suppliers/suppliers.module";
import { PurchaseOrdersModule } from "./modules/purchase-orders/purchase-orders.module";
import { SubscriptionModule } from "./modules/subscription/subscription.module";
import { AdminModule } from "./modules/admin/admin.module";
import { SettingsModule } from "./modules/settings/settings.module";
import { ImportExportModule } from "./modules/import-export/import-export.module";
import { SystemModule } from "./modules/system/system.module";
import { DemoRequestsModule } from "./modules/demo-requests/demo-requests.module";
import { validateEnv } from "./config/env.validation";
import { AppLogger } from "./common/logger/app.logger";
import { RequestLoggingInterceptor } from "./common/interceptors/request-logging.interceptor";
import { AllExceptionsFilter } from "./common/filters/all-exceptions.filter";
import { ThrottlerGuard } from "@nestjs/throttler";
import { BootstrapModule } from "./bootstrap/bootstrap.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [`.env.${process.env.NODE_ENV ?? "development"}`, ".env", ".env.local"],
      validate: validateEnv,
    }),
    ThrottlerModule.forRootAsync({
      inject: [],
      useFactory: () => [
        {
          ttl: Number(process.env.THROTTLE_TTL_SECONDS ?? 60) * 1000,
          limit: Number(process.env.THROTTLE_LIMIT ?? 120),
        },
      ],
    }),
    PrismaModule,
    HealthModule,
    AuthModule,
    UsersModule,
    StoresModule,
    BranchesModule,
    RolesModule,
    PermissionsModule,
    CategoriesModule,
    ProductsModule,
    InventoryModule,
    ShiftsModule,
    PosModule,
    InvoicesModule,
    ReturnsModule,
    ExpensesModule,
    DashboardModule,
    ReportsModule,
    ClosingModule,
    CustomersModule,
    SuppliersModule,
    PurchaseOrdersModule,
    SubscriptionModule,
    AdminModule,
    SettingsModule,
    ImportExportModule,
    SystemModule,
    DemoRequestsModule,
    BootstrapModule,
  ],
  providers: [
    AppLogger,
    RequestLoggingInterceptor,
    AllExceptionsFilter,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}
