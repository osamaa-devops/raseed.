import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env", ".env.local"],
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
  ],
})
export class AppModule {}
