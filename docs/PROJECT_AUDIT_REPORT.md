# Raseed — رصيد Project Audit Report

Date: 2026-07-06  
Audited by: Codex

## 1. Project overview

### What Raseed does

Raseed is an Arabic RTL POS and retail management SaaS for supermarkets, mini markets, grocery stores, electronics/mobile shops, cosmetics shops, and general retail stores. It combines cashier sales, inventory, invoices, returns, expenses, supplier and customer balances, reporting, subscription-aware SaaS administration, and demo-friendly printing/import tools.

### Main users

- Store owner
- Branch manager
- Cashier
- Inventory operator
- Super admin / SaaS operator

### Main modules

- Authentication and session bootstrap
- Store / branch context
- Roles and permissions
- Products and categories
- Inventory and stock movements
- POS and held orders
- Invoices, receipt preview, and payments
- Returns and restocking
- Expenses
- Dashboard and reports
- Shift management and end-of-day closing
- Customers and debts
- Suppliers and purchase orders
- Subscription management and SaaS admin
- Receipt settings, barcode labels, import/export
- Demo mode and demo walkthrough

### Current product status

Current status is best described as:

- **Operational demo-ready MVP** for real walkthroughs
- **Technically substantial** on backend business flows
- **Not fully production-ready yet** despite recent deployment groundwork
- **Feature-complete in breadth**, but with a few frontend areas still placeholder/demo-only

The implemented backend covers many real transactional flows. The main gap is not missing breadth; it is production hardening and a few weak/placeholder frontend areas.

---

## 2. Tech stack

### Frontend stack

- React 18
- Vite 6
- TypeScript
- Tailwind CSS 4
- React Router 7
- Radix UI primitives
- Lucide icons
- Recharts
- React Hook Form
- `next-themes` for light/dark/system theming

Reference files:

- [frontend/package.json](/home/osos/Desktop/raseed./frontend/package.json)
- [frontend/src/app/routes/routeConfig.tsx](/home/osos/Desktop/raseed./frontend/src/app/routes/routeConfig.tsx)

### Backend stack

- NestJS 10
- TypeScript
- Prisma Client
- PostgreSQL
- JWT via `@nestjs/jwt`
- `bcryptjs` for password hashing
- `class-validator` / `class-transformer`
- `helmet`
- `@nestjs/throttler`
- `exceljs` and `csv-parse`

Reference files:

- [backend/package.json](/home/osos/Desktop/raseed./backend/package.json)
- [backend/src/main.ts](/home/osos/Desktop/raseed./backend/src/main.ts)
- [backend/src/app.module.ts](/home/osos/Desktop/raseed./backend/src/app.module.ts)

### Database

- PostgreSQL
- Prisma schema with 12 migration directories currently present under [backend/prisma/migrations](/home/osos/Desktop/raseed./backend/prisma/migrations)

### ORM

- Prisma (`@prisma/client`, Prisma CLI)

### Auth

- JWT access tokens with refresh-token rotation
- Password hashing with bcrypt
- Role + permission evaluation at request time
- HttpOnly refresh-token cookie sessions

### Testing

- Backend: Jest + Supertest + PostgreSQL-backed e2e tests
- Frontend: Vitest + Testing Library

### Deployment setup

- Local-first development with PostgreSQL installed on the host
- Electron desktop launch path for offline POS use
- Production packaging remains a separate, optional concern
- Healthchecks and local logs are included

### Important libraries

- Backend: `@nestjs/throttler`, `helmet`, `bcryptjs`, `exceljs`, `csv-parse`
- Frontend: `recharts`, `lucide-react`, `sonner`, Radix components, `next-themes`

---

## 3. Current features implemented

Below is the functional audit by module.

### Auth

- Implemented status: **Implemented**
- Backend endpoints:
  - `POST /api/auth/login`
  - `GET /api/auth/me`
  - `POST /api/auth/logout`
  - `POST /api/auth/refresh`
- Frontend pages:
  - `/login` via [frontend/src/pages/public/LoginPage.tsx](/home/osos/Desktop/raseed./frontend/src/pages/public/LoginPage.tsx)
- Permissions:
  - Login is public
  - `/me`, `/logout`, `/refresh` require JWT
- Known limitations:
  - Session hardening is now in place, but production cookie policy and CSRF guidance still need to be validated per deployment topology
  - Multi-device session management UI is still not exposed to end users

### Stores / Branches

- Implemented status: **Implemented**
- Backend endpoints:
  - `GET /api/stores/me`
  - `PATCH /api/stores/me`
  - `GET /api/branches`
  - `POST /api/branches`
  - `PATCH /api/branches/:id`
  - `PATCH /api/branches/:id/status`
- Frontend pages:
  - Store settings embedded in `/settings`
  - Super admin store management at `/super-admin/stores`
- Permissions:
  - Branch create/update/status and store update require `settings.manage`
- Known limitations:
  - No dedicated owner-facing branch management page in frontend; capability exists mostly through APIs/admin flow

### Roles / Permissions

- Implemented status: **Backend implemented, frontend partially placeholder**
- Backend endpoints:
  - `GET /api/roles`
  - `GET /api/permissions`
  - `GET /api/users/:id/permissions`
- Frontend pages:
  - `/users-permissions`
- Permissions:
  - User management endpoints require `users.manage`
  - `GET /api/roles` and `GET /api/permissions` require JWT only, not explicit permission gates
- Known limitations:
  - [frontend/src/pages/admin/UsersPermissionsPage.tsx](/home/osos/Desktop/raseed./frontend/src/pages/admin/UsersPermissionsPage.tsx) still shows demo data, not full RBAC management
  - Roles/permissions read endpoints may be broader than needed for least-privilege production

### Products / Categories

- Implemented status: **Implemented**
- Backend endpoints:
  - Categories:
    - `GET /api/categories`
    - `GET /api/categories/:id`
    - `POST /api/categories`
    - `PATCH /api/categories/:id`
    - `PATCH /api/categories/:id/status`
    - `DELETE /api/categories/:id`
  - Products:
    - `GET /api/products`
    - `GET /api/products/:id`
    - `POST /api/products`
    - `PATCH /api/products/:id`
    - `PATCH /api/products/:id/status`
    - `DELETE /api/products/:id`
    - `POST /api/products/:id/generate-barcode`
    - `POST /api/products/barcode-labels`
- Frontend pages:
  - `/products`
  - `/categories`
- Permissions:
  - `products.view/create/update/delete/generate_barcode`
  - `categories.view/create/update/delete`
  - `printing.barcodes`
- Known limitations:
  - Product image handling is URL-only; no upload subsystem
  - Barcode label rendering is visual only on frontend, not guaranteed scannable

### Inventory

- Implemented status: **Implemented**
- Backend endpoints:
  - `GET /api/inventory/stocks`
  - `GET /api/inventory/stocks/:productId`
  - `GET /api/inventory/movements`
  - `POST /api/inventory/add-stock`
  - `POST /api/inventory/remove-stock`
  - `POST /api/inventory/adjust`
  - `GET /api/inventory/low-stock`
  - `GET /api/inventory/expiry-alerts`
- Frontend pages:
  - `/inventory`
- Permissions:
  - `inventory.view`
  - `inventory.view_movements`
  - `inventory.add_stock`
  - `inventory.remove_stock`
  - `inventory.adjust`
  - `inventory.view_alerts`
- Known limitations:
  - No transfer workflow between branches yet despite enum placeholders
  - Low-stock filtering is page-based but not deeply optimized for very large datasets

### POS

- Implemented status: **Implemented**
- Backend endpoints:
  - `POST /api/pos/sale`
  - `GET /api/pos/recent-invoices`
  - `GET /api/pos/held-orders`
  - `POST /api/pos/held-orders`
  - `DELETE /api/pos/held-orders/:id`
- Frontend pages:
  - `/pos`
- Permissions:
  - `pos.sell`
  - `pos.view_recent_invoices`
  - `pos.hold_order`
  - Frontend also checks `pos.access`
- Known limitations:
  - No offline queue yet
  - No partial-credit sale workflow yet
  - No silent printer / device integration yet

### Invoices

- Implemented status: **Implemented**
- Backend endpoints:
  - `GET /api/invoices`
  - `GET /api/invoices/by-number/:invoiceNumber`
  - `GET /api/invoices/:id`
  - `GET /api/invoices/:id/receipt`
- Frontend pages:
  - `/sales`
  - Receipt preview from POS and invoice flows
- Permissions:
  - `invoices.view`
  - Receipt endpoint additionally checks `invoices.view` or `printing.receipts` or super admin in service
- Known limitations:
  - No PDF export
  - No invoice void/cancel management UI detected

### Payments

- Implemented status: **Implemented within invoice / return / subscription flows**
- Backend endpoints:
  - Embedded in POS sale creation
  - Refund payment record created during returns
  - Subscription payments:
    - `GET /api/admin/subscription-payments`
    - `POST /api/admin/subscription-payments`
- Frontend pages:
  - POS payment section
  - `/subscription-billing`
  - `/super-admin/payments`
- Permissions:
  - POS payment tied to `pos.sell`
  - Admin payment permissions under `admin.payments.*`
- Known limitations:
  - No gateway integration yet
  - No dedicated payments reconciliation module

### Shifts

- Implemented status: **Implemented**
- Backend endpoints:
  - `GET /api/shifts/current`
  - `POST /api/shifts/open`
  - `POST /api/shifts/close`
  - `GET /api/shifts`
- Frontend pages:
  - `/shifts`
- Permissions:
  - `shifts.view`
  - `shifts.open`
  - `shifts.close`
- Known limitations:
  - No advanced cash counting workflow beyond current structure

### Returns

- Implemented status: **Implemented**
- Backend endpoints:
  - `GET /api/returns`
  - `GET /api/returns/by-number/:returnNumber`
  - `GET /api/returns/:id`
  - `POST /api/returns`
- Frontend pages:
  - `/returns`
- Permissions:
  - `returns.view`
  - `returns.create`
  - Service also accepts `invoices.refund` as alternate authority
- Known limitations:
  - No approval / cancellation workflow for returns yet
  - Refund is always represented as a negative payment record, not as a richer treasury workflow

### Expenses

- Implemented status: **Implemented**
- Backend endpoints:
  - `GET /api/expenses`
  - `GET /api/expenses/:id`
  - `POST /api/expenses`
  - `PATCH /api/expenses/:id`
  - `DELETE /api/expenses/:id`
- Frontend pages:
  - `/expenses`
- Permissions:
  - `expenses.view/create/update/delete`
- Known limitations:
  - Soft-delete pattern on backend, but no restore flow

### Dashboard

- Implemented status: **Implemented**
- Backend endpoints:
  - `GET /api/dashboard/overview`
- Frontend pages:
  - `/dashboard`
- Permissions:
  - `dashboard.view`
- Known limitations:
  - Uses aggregated reads and some in-memory shaping; fine for MVP, but large-scale stores may need optimization

### Reports

- Implemented status: **Implemented**
- Backend endpoints:
  - `GET /api/reports/daily-sales`
  - `GET /api/reports/monthly-sales`
  - `GET /api/reports/profit`
  - `GET /api/reports/payment-methods`
  - `GET /api/reports/cashier-performance`
  - `GET /api/reports/best-selling-products`
  - `GET /api/reports/worst-selling-products`
  - `GET /api/reports/inventory-value`
  - `GET /api/reports/expenses`
- Frontend pages:
  - `/reports`
- Permissions:
  - `reports.view`
  - export endpoints require `reports.export`
- Known limitations:
  - No PDF reporting
  - Large export/report pagination strategy is still basic

### End-of-day closing

- Implemented status: **Implemented**
- Backend endpoints:
  - `GET /api/closing/summary`
  - `POST /api/closing/close-day`
  - `GET /api/closing/history`
- Frontend pages:
  - `/closing`
- Permissions:
  - `closing.view`
  - `closing.create`
- Known limitations:
  - No reopen/reversal workflow after closure
  - Cash expectation logic is simplified and should be validated against business policy

### Customers / Debts

- Implemented status: **Implemented**
- Backend endpoints:
  - `GET /api/customers`
  - `GET /api/customers/:id`
  - `POST /api/customers`
  - `PATCH /api/customers/:id`
  - `PATCH /api/customers/:id/status`
  - `DELETE /api/customers/:id`
  - `GET /api/customers/:id/debt-transactions`
  - `POST /api/customers/:id/debt/add`
  - `POST /api/customers/:id/debt/payment`
  - `POST /api/customers/:id/debt/adjust`
- Frontend pages:
  - `/customers-debts`
- Permissions:
  - `customers.view/create/update/delete`
  - `debts.view/add/pay/adjust`
- Known limitations:
  - No automated debt generation from credit-sale invoices yet

### Suppliers / Purchase Orders

- Implemented status: **Implemented**
- Backend endpoints:
  - Suppliers:
    - `GET /api/suppliers`
    - `GET /api/suppliers/:id`
    - `POST /api/suppliers`
    - `PATCH /api/suppliers/:id`
    - `PATCH /api/suppliers/:id/status`
    - `DELETE /api/suppliers/:id`
    - `GET /api/suppliers/:id/transactions`
    - `POST /api/suppliers/:id/payment`
    - `POST /api/suppliers/:id/adjust`
  - Purchase orders:
    - `GET /api/purchase-orders`
    - `GET /api/purchase-orders/:id`
    - `POST /api/purchase-orders`
    - `PATCH /api/purchase-orders/:id`
    - `PATCH /api/purchase-orders/:id/status`
    - `POST /api/purchase-orders/:id/receive`
    - `DELETE /api/purchase-orders/:id`
- Frontend pages:
  - `/suppliers`
  - `/purchase-orders`
- Permissions:
  - `suppliers.*`
  - `purchase_orders.view/create/update/receive/cancel`
- Known limitations:
  - No supplier invoice attachment storage
  - No branch transfer / inter-warehouse receiving

### Subscription / SaaS Admin

- Implemented status: **Implemented**
- Backend endpoints:
  - Owner subscription:
    - `GET /api/subscription/me`
    - `GET /api/subscription/usage`
  - Admin:
    - `GET /api/admin/overview`
    - `GET /api/admin/stores`
    - `GET /api/admin/stores/:id`
    - `POST /api/admin/stores`
    - `PATCH /api/admin/stores/:id`
    - `PATCH /api/admin/stores/:id/status`
    - `GET /api/admin/plans`
    - `GET /api/admin/plans/:id`
    - `POST /api/admin/plans`
    - `PATCH /api/admin/plans/:id`
    - `PATCH /api/admin/plans/:id/status`
    - `GET /api/admin/subscriptions`
    - `GET /api/admin/subscriptions/:id`
    - `PATCH /api/admin/subscriptions/:id`
    - `POST /api/admin/subscriptions/:id/renew`
    - `GET /api/admin/subscription-payments`
    - `POST /api/admin/subscription-payments`
- Frontend pages:
  - `/subscription-billing`
  - `/subscription-blocked`
  - `/super-admin`
  - `/super-admin/stores`
  - `/super-admin/plans`
  - `/super-admin/payments`
- Permissions:
  - `subscription.view`
  - `admin.platform_access`
  - `admin.stores.*`
  - `admin.plans.*`
  - `admin.subscriptions.*`
  - `admin.payments.*`
- Known limitations:
  - Upgrade purchase flow is still placeholder in frontend
  - No external billing provider integration

### Receipt / Printing

- Implemented status: **Implemented for browser preview/print**
- Backend endpoints:
  - `GET /api/invoices/:id/receipt`
  - `GET /api/settings/receipt`
  - `PATCH /api/settings/receipt`
- Frontend pages:
  - POS success modal / receipt preview
  - `/settings`
- Permissions:
  - `printing.receipts` or `invoices.view` for receipt payload access
  - `settings.receipt.view`
  - `settings.receipt.update`
- Known limitations:
  - Browser print only
  - No silent printing
  - Thermal-printer formatting still depends on browser behavior

### Barcode tools

- Implemented status: **Implemented**
- Backend endpoints:
  - `POST /api/products/:id/generate-barcode`
  - `POST /api/products/barcode-labels`
  - `GET /api/settings/barcode-labels`
  - `PATCH /api/settings/barcode-labels`
- Frontend pages:
  - `/products`
  - `/settings`
- Permissions:
  - `products.generate_barcode`
  - `printing.barcodes`
- Known limitations:
  - Browser print is the supported path for now; hardware thermal/barcode-printer support is still a later desktop phase
  - Barcode values are generated as CODE128-safe retail strings, so product data still needs to be kept barcode-clean

### Import / Export

- Implemented status: **Implemented**
- Backend endpoints:
  - Templates:
    - `GET /api/import-export/templates/products.:format`
    - `GET /api/import-export/templates/initial-stock.:format`
  - Imports:
    - `POST /api/import-export/products/preview`
    - `POST /api/import-export/products/import`
    - `POST /api/import-export/initial-stock/preview`
    - `POST /api/import-export/initial-stock/import`
  - Exports:
    - `GET /api/import-export/products`
    - `GET /api/import-export/inventory`
    - `GET /api/import-export/invoices`
    - `GET /api/import-export/expenses`
    - `GET /api/import-export/customers`
    - `GET /api/import-export/suppliers`
    - `GET /api/import-export/reports/daily-sales`
    - `GET /api/import-export/reports/profit`
    - `GET /api/import-export/reports/inventory-value`
- Frontend pages:
  - `/import-export`
- Permissions:
  - `products.import/export`
  - `inventory.import/export`
  - `data.export`
  - `reports.export`
- Known limitations:
  - In-memory upload handling only
  - 10 MB file cap and 5,000 row limit are good for safety but not for very large catalogs

### Demo mode

- Implemented status: **Implemented**
- Backend support:
  - Seeded demo store, products, invoices, returns, expenses, suppliers, customers
- Frontend pages/components:
  - `/demo-script`
  - demo banner in topbar/sidebar/POS/dashboard
- Permissions:
  - Uses normal auth and seeded roles
- Known limitations:
  - Demo credentials are still accessible via README and dev helper autofill in demo/dev mode
  - Some pages in demo still use static demo arrays instead of live APIs

### Tests

- Implemented status: **Implemented but still thin for scope**
- Backend test files:
  - [backend/test/auth-and-tenant.e2e-spec.ts](/home/osos/Desktop/raseed./backend/test/auth-and-tenant.e2e-spec.ts)
  - [backend/test/inventory-pos.e2e-spec.ts](/home/osos/Desktop/raseed./backend/test/inventory-pos.e2e-spec.ts)
  - [backend/test/import-export.e2e-spec.ts](/home/osos/Desktop/raseed./backend/test/import-export.e2e-spec.ts)
- Frontend test files:
  - [frontend/src/services/apiClient.test.ts](/home/osos/Desktop/raseed./frontend/src/services/apiClient.test.ts)
  - [frontend/src/pages/import-export/ImportExportPage.test.tsx](/home/osos/Desktop/raseed./frontend/src/pages/import-export/ImportExportPage.test.tsx)
- Permissions:
  - N/A
- Known limitations:
  - Core financial/operational modules such as returns, customers, suppliers, purchase orders, closing, dashboard, settings, and super admin need deeper test coverage

---

## 4. Database audit

### Prisma models

Defined models in [backend/prisma/schema.prisma](/home/osos/Desktop/raseed./backend/prisma/schema.prisma):

- Store
- Branch
- User
- Role
- Permission
- RolePermission
- UserPermission
- Category
- Product
- ReceiptSettings
- BarcodeLabelSettings
- InventoryStock
- InventoryMovement
- InventoryBatch
- CashierShift
- Invoice
- InvoiceItem
- Payment
- HeldOrder
- Return
- ReturnItem
- Expense
- DailyClosing
- Customer
- CustomerDebtTransaction
- Supplier
- SupplierTransaction
- PurchaseOrder
- PurchaseOrderItem
- SubscriptionPlan
- Subscription
- SubscriptionPayment
- ActivityLog

### Important relationships

- `Store` is the tenant root and owns nearly all business entities
- `Branch` belongs to `Store`
- `User` belongs to `Store`, optionally `Branch`, optionally `Role`
- `RolePermission` and `UserPermission` provide RBAC
- `Product` belongs to `Store`, optionally `Category`
- `InventoryStock` is unique on `(storeId, branchId, productId)`
- `Invoice` belongs to store/branch/cashier/shift/customer
- `InvoiceItem` snapshots product name, barcode, purchase price, and unit price
- `Return` belongs to `Invoice`; `ReturnItem` belongs to `InvoiceItem`
- `PurchaseOrder` belongs to `Supplier`; receiving impacts `InventoryStock` and `SupplierTransaction`
- `DailyClosing` is unique per `(storeId, branchId, date)`
- `Subscription` belongs to `Store` and `SubscriptionPlan`

### Multi-tenant strategy

The project uses explicit store scoping rather than database-per-tenant:

- `storeId` is required on store-owned entities
- `branchId` is added for branch-bound workflows
- Helpers document this pattern in [backend/src/common/utils/tenant-scope.ts](/home/osos/Desktop/raseed./backend/src/common/utils/tenant-scope.ts)
- Guard/services enforce `storeId` matching in implemented modules

### Store / branch isolation

Isolation is generally good:

- Implemented business modules explicitly scope queries with `storeId`
- Many branch workflows validate branch ownership before use
- Super admin access is separated by role/permission checks

Main caution:

- Isolation is enforced in application logic, not PostgreSQL row-level security

### Key indexes / constraints

Important examples:

- Branch unique per store by name: `@@unique([storeId, name])`
- User unique email/phone per store
- Product unique barcode and SKU per store
- Inventory stock unique per store + branch + product
- Invoice unique number per store + branch
- Return unique number per store + branch
- Customer unique phone per store
- Supplier unique phone per store
- Purchase order unique number per store + branch
- Subscription plan code globally unique
- Daily closing unique per store + branch + date

### Migration status

- 12 migration directories exist
- `npx prisma validate` passed
- `npx prisma generate` passed
- Backend tests reported **no pending migrations** for the test database during global setup
- `npx prisma migrate status` against the local development DB failed with a Prisma schema engine error in this audit session, so **development DB migration status was not fully verified**

### Seed data status

Seed file: [backend/prisma/seed.ts](/home/osos/Desktop/raseed./backend/prisma/seed.ts)

Seed coverage includes:

- Demo store `ماركت المدينة`
- Subscription plan and active subscription
- Super admin and store users
- Demo categories and products
- Inventory quantities and batches
- Demo invoices
- Demo return
- Demo expenses
- Demo customers
- Demo suppliers
- Demo shift

Seed quality is good for demoing. It is not a generic production bootstrap.

---

## 5. Security audit

### JWT

- JWT access tokens are implemented
- Secret is environment-driven and validated in [backend/src/config/env.validation.ts](/home/osos/Desktop/raseed./backend/src/config/env.validation.ts)
- Production requires stronger secret length
- Refresh-token rotation uses HttpOnly cookies and session records

### Password hashing

- Passwords are hashed with bcrypt (`bcryptjs`) in:
  - [backend/src/modules/auth/auth.service.ts](/home/osos/Desktop/raseed./backend/src/modules/auth/auth.service.ts)
  - [backend/src/modules/users/users.service.ts](/home/osos/Desktop/raseed./backend/src/modules/users/users.service.ts)
  - [backend/src/modules/admin/admin.service.ts](/home/osos/Desktop/raseed./backend/src/modules/admin/admin.service.ts)

### Guards

- JWT guard: [backend/src/common/guards/jwt-auth.guard.ts](/home/osos/Desktop/raseed./backend/src/common/guards/jwt-auth.guard.ts)
- Permission guard: [backend/src/common/guards/permissions.guard.ts](/home/osos/Desktop/raseed./backend/src/common/guards/permissions.guard.ts)
- Route decorators are used widely across modules

### Permissions

- Permission coverage is generally strong on business endpoints
- Two weaker spots:
  - `GET /api/roles` requires JWT but no explicit permission
  - `GET /api/permissions` requires JWT but no explicit permission

### Tenant isolation

- Generally well enforced in implemented business services
- Store access checks are explicit and repeated
- Super admin separation is respected

### CORS

- Environment-based allowlist in [backend/src/main.ts](/home/osos/Desktop/raseed./backend/src/main.ts)
- Good baseline for production

### Helmet / rate limiting

- `helmet()` is enabled
- Global throttling is enabled
- Login has stricter throttling

### File uploads

- Import uploads are memory-only
- Allowed extensions limited to `.xlsx` and `.csv`
- File size limited to 10 MB

### Import / export safety

- Validation exists
- Row caps exist
- Formula injection mitigation exists in exports
- Good baseline for spreadsheet safety

### Admin routes

- Protected with `admin.platform_access` and more specific admin permissions
- Frontend also isolates super admin routes in [frontend/src/app/routes/ProtectedRoute.tsx](/home/osos/Desktop/raseed./frontend/src/app/routes/ProtectedRoute.tsx)

### Subscription enforcement

- Implemented in JWT guard
- Store users are blocked when subscription/store state is expired/suspended/cancelled
- Whitelisted endpoints remain accessible for subscription info and health

### Data leakage risks

Main risks observed:

- Auth payload is kept in memory while refresh-token sessions live in HttpOnly cookies
- Some demo-only frontend pages show static demo data rather than role-scoped live data
- Roles/permissions list endpoints are broader than ideal
- Receipt payload endpoint returns rich invoice/store/branch context; permission checks exist, but this endpoint should stay under close review

Security conclusion:

- **Reasonable MVP baseline**
- **Not yet security-hardened enough for “confident production” without follow-up**

---

## 6. Critical business logic audit

### POS transaction behavior

Status: **Good**

- `createSale()` in [backend/src/modules/pos/pos.service.ts](/home/osos/Desktop/raseed./backend/src/modules/pos/pos.service.ts) validates:
  - branch
  - customer
  - shift
  - product ownership
  - stock sufficiency
  - payment total
- It writes invoice, items, payments, stock decrements, and movements inside a Prisma transaction

### Stock decrease on sale

Status: **Implemented correctly**

- Inventory stock is decremented per item
- `InventoryMovementType.SALE` is created with before/after quantities
- Tested in backend test suite

### Stock increase on return

Status: **Implemented correctly**

- When `restocked` is true, return flow upserts stock and adds `RETURN` movement
- Invoice item `returnedQuantity` is updated
- Invoice status is recalculated to `PARTIALLY_REFUNDED` or `REFUNDED`

### Purchase order receiving

Status: **Implemented**

- Receiving updates ordered item quantities
- Increases inventory stock
- Creates `PURCHASE` movements
- Creates inventory batches when batch/expiry exists
- Updates PO status to partially/fully received

### Supplier balance

Status: **Implemented**

- Unpaid received value increases `Supplier.currentBalance`
- Supplier payment and adjustment flows update balance transactionally

### Customer debt balance

Status: **Implemented, but not invoice-integrated**

- Manual add/pay/adjust flows are transactional
- Balance cannot go negative during pay/adjust-out
- No automated debt creation from a partially paid invoice because credit sales are not implemented yet

### End-of-day closing

Status: **Implemented**

- Closing requires no open shifts
- Duplicate closing for same store/branch/date is prevented
- Immutable snapshot written to `DailyClosing`

### Invoice snapshots

Status: **Good**

- Invoice items snapshot:
  - product name
  - barcode
  - purchase price
  - unit price
- This is important for later catalog edits

### Failed transaction rollback

Status: **Good**

- POS sale and inventory-changing flows are transactional
- Backend tests explicitly cover “sale failure should not reduce stock or create invoices”

### Duplicate barcode / SKU handling

Status: **Implemented**

- Enforced in both service logic and Prisma unique constraints per store
- Same barcode across different stores is allowed and tested

Business-logic conclusion:

- The core transactional design is one of the strongest parts of the project.

---

## 7. Testing audit

### Current test setup

- Backend uses Jest + Supertest + real PostgreSQL test DB
- Backend global setup creates/ensures test DB and runs `prisma migrate deploy`
- Test DB safety guard prevents truncating non-test databases
- Frontend uses Vitest + Testing Library + JSDOM

Reference files:

- [backend/test/global-setup.js](/home/osos/Desktop/raseed./backend/test/global-setup.js)
- [backend/test/utils/test-db.ts](/home/osos/Desktop/raseed./backend/test/utils/test-db.ts)
- [frontend/src/test/setup.ts](/home/osos/Desktop/raseed./frontend/src/test/setup.ts)

### Test files

- Backend:
  - `auth-and-tenant.e2e-spec.ts`
  - `inventory-pos.e2e-spec.ts`
  - `import-export.e2e-spec.ts`
- Frontend:
  - `apiClient.test.ts`
  - `ImportExportPage.test.tsx`

### Number of tests

- Backend: **13**
- Frontend: **3**
- Total observed: **16**

### What flows are covered

- Login success/failure
- Protected route rejection without token
- Permission rejection
- Tenant isolation on products
- Same-store uniqueness vs cross-store duplicates
- Super admin boundary behavior
- Inventory add/remove/adjust movement creation
- Sale rollback on failure
- Successful sale effects
- Payment-under-total rejection
- Import/export upload type safety
- Import preview validation
- Product import upsert
- Initial stock import movements
- CSV export sanitization against formula-like values
- Frontend auth header attachment and 401 cleanup
- Import preview UI rendering

### What critical flows still need tests

- Returns full and partial refund lifecycle
- Purchase order receiving and supplier balance changes
- Customer debt add/pay/adjust lifecycle
- End-of-day closing calculations and duplicate prevention
- Dashboard/report math integrity
- Receipt endpoint authorization
- Subscription enforcement edge cases
- Settings persistence
- Admin store/plan/subscription mutations
- Frontend protected-route behavior with subscription blocked states

### How to run tests

Backend:

```bash
cd backend
npm test
```

Frontend:

```bash
cd frontend
npm test
```

Testing conclusion:

- Coverage is meaningful for a few high-risk flows
- Coverage is still too narrow relative to project breadth

---

## 8. UI/UX audit

### Overall visual quality

- Good overall direction for a modern SaaS POS demo
- Shared UI shell, cards, badges, and layout consistency are present
- Dashboard and POS have noticeably more polish than placeholder areas

### Arabic RTL quality

- Strong in general
- Visible Arabic copy is mostly clear and professional
- Layout patterns appear intentionally RTL

### Light / dark mode

- Implemented and structurally sound
- Theme switching is exposed in `/settings`

### POS usability

- Strongest frontend screen
- Barcode/search input is prominent
- Totals are visually emphasized
- Cart/payment flow is clear
- Touch-friendly buttons are present
- Demo banner and hints are useful

Reference: [frontend/src/pages/pos/PosPage.tsx](/home/osos/Desktop/raseed./frontend/src/pages/pos/PosPage.tsx)

### Dashboard clarity

- Good for a 30-second owner summary
- KPIs are focused and understandable
- Quick actions are well placed

Reference: [frontend/src/pages/dashboard/OwnerDashboardPage.tsx](/home/osos/Desktop/raseed./frontend/src/pages/dashboard/OwnerDashboardPage.tsx)

### Print / receipt quality

- Receipt preview structure is clean and readable
- Thermal-style black/white direction is appropriate
- Browser print readiness is present

Reference: [frontend/src/components/printing/PrintableReceipt.tsx](/home/osos/Desktop/raseed./frontend/src/components/printing/PrintableReceipt.tsx)

### Mobile / tablet readiness

- Dashboard shell appears tablet-friendly by code structure
- POS remains desktop-first as intended
- Tables rely on overflow containers in several areas, which is acceptable but not deeply optimized

Important note:

- This audit did **not** include browser screenshot validation across device sizes in this turn, so this is a code-based assessment, not a visual QA sign-off.

### Placeholder pages still needing polish

These are not “missing routes”; they exist, but some are still placeholders or demo-backed:

- [frontend/src/pages/insights/AiInsightsPage.tsx](/home/osos/Desktop/raseed./frontend/src/pages/insights/AiInsightsPage.tsx) — placeholder
- [frontend/src/pages/super-admin/SupportTicketsPage.tsx](/home/osos/Desktop/raseed./frontend/src/pages/super-admin/SupportTicketsPage.tsx) — placeholder
- [frontend/src/pages/admin/UsersPermissionsPage.tsx](/home/osos/Desktop/raseed./frontend/src/pages/admin/UsersPermissionsPage.tsx) — demo-only list, not real RBAC UI
- [frontend/src/pages/admin/ActivityLogsPage.tsx](/home/osos/Desktop/raseed./frontend/src/pages/admin/ActivityLogsPage.tsx) — demo-only list
- [frontend/src/pages/insights/NotificationsPage.tsx](/home/osos/Desktop/raseed./frontend/src/pages/insights/NotificationsPage.tsx) — demo notifications
- [frontend/src/pages/admin/HelpSupportPage.tsx](/home/osos/Desktop/raseed./frontend/src/pages/admin/HelpSupportPage.tsx) — static/helpful but not operational support center
- [frontend/src/pages/admin/SubscriptionBillingPage.tsx](/home/osos/Desktop/raseed./frontend/src/pages/admin/SubscriptionBillingPage.tsx) — useful, but upgrade action still placeholder
- Hardware section in [frontend/src/pages/admin/SettingsPage.tsx](/home/osos/Desktop/raseed./frontend/src/pages/admin/SettingsPage.tsx) — explicitly placeholder

UI/UX conclusion:

- **Safe to demo**
- **Not yet uniformly polished across all routes**

---

## 9. Demo readiness

### Demo credentials

Documented in [README.md](/home/osos/Desktop/raseed./README.md):

- `admin@raseed.local` / `RaseedAdmin!2026`
- `owner@raseed.local` / `RaseedOwner!2026`
- other seeded roles as well

### Demo data quality

Demo data is strong:

- Realistic store name: `ماركت المدينة`
- Products, categories, stock, suppliers, customers
- Seeded invoices and return
- Seeded expenses and shift
- SaaS subscription context exists

### Demo script location

- In app: `/demo-script`
- Docs: README demo section

### Best demo flow

Best flow for a supermarket owner:

1. Login as owner
2. Open dashboard and show “today in 30 seconds”
3. Open POS and complete a sale
4. Show receipt preview
5. Show inventory reduction
6. Create a return
7. Show inventory increase and invoice status change
8. Show reports
9. Show Excel import/export readiness
10. Show super admin SaaS panel if selling the platform model

### What to show to a supermarket owner

Strongest parts to show:

- POS speed
- Inventory auto-sync
- Returns workflow
- Dashboard clarity
- Receipt and barcode printing readiness
- Import from Excel

### Demo risks

- Users & permissions page is not fully real yet
- Activity logs and notifications are demo-backed
- Barcode labels look good visually but are not yet trustworthy for real scanner production use
- AI insights and support tickets are placeholders

Demo conclusion:

- **Yes, demo-ready**
- **Yes, safe to show to real store owners**
- as long as the presentation focuses on implemented operational workflows

---

## 10. Deployment readiness

### Local desktop status

- Electron desktop bootstrap exists
- Local PostgreSQL is the expected development database
- Backend and frontend build successfully in this workspace
- First-run setup wizard is wired to the bootstrap flow

### Environment variables

- Environment docs and examples are present
- Backend env validation is implemented
- Frontend env support is minimal but adequate

### Production config

- CORS allowlist
- JWT secret validation
- Helmet
- throttling
- request/error logging

### Nginx / reverse proxy

- Present and reasonably prepared
- Includes:
  - SPA fallback
  - API reverse proxy
  - gzip
  - security headers
  - HTTPS-ready commented lines

### Backup strategy

- Documented
- Backup/restore scripts exist:
  - [scripts/backup-db.sh](/home/osos/Desktop/raseed./scripts/backup-db.sh)
  - [scripts/restore-db.sh](/home/osos/Desktop/raseed./scripts/restore-db.sh)

### Monitoring / health checks

- `GET /api/health` implemented with DB health
- Compose healthchecks exist
- Nginx `/healthz` exists
- Prometheus/Grafana are placeholders only

### CI/CD status

- GitHub Actions workflow exists and is useful
- Covers:
  - frontend typecheck/build/tests
  - backend build/tests
  - prisma validate
  - docker config/build validation

### What is still needed before production

- Validate CSRF posture for cookie-based auth in the deployment topology
- Tighten role/permission listing access
- Keep barcode printing on the browser path until desktop hardware printing is added
- Expand tests for financial flows
- Perform staging rollout and rollback rehearsal
- Keep Prisma migration workflow healthy in local PostgreSQL shells
- Conduct browser/device QA, print QA, and operational recovery drills

Deployment conclusion:

- **Deployment foundation exists**
- **Operational production confidence is not there yet**

---

## 11. Known issues and risks

### Critical

No code-level critical defect was found that makes the whole product unusable. Core POS/inventory transaction behavior looks sound.

### High

1. **Browser print remains the barcode printing path**
   - Area: [frontend/src/components/printing/BarcodeLabel.tsx](/home/osos/Desktop/raseed./frontend/src/components/printing/BarcodeLabel.tsx), [frontend/src/components/printing/BarcodeLabelsSheet.tsx](/home/osos/Desktop/raseed./frontend/src/components/printing/BarcodeLabelsSheet.tsx)
   - Risk: Thermal-printer tuning is still deferred to the desktop/hardware phase

### Medium

1. **Roles and permissions listing endpoints are broader than ideal**
   - Area: [backend/src/modules/roles/roles.controller.ts](/home/osos/Desktop/raseed./backend/src/modules/roles/roles.controller.ts), [backend/src/modules/permissions/permissions.controller.ts](/home/osos/Desktop/raseed./backend/src/modules/permissions/permissions.controller.ts)
   - Risk: authenticated users can enumerate authorization metadata without explicit permission gates

2. **Several frontend admin/support/insight screens are still placeholder or demo-backed**
   - Area:
     - [frontend/src/pages/admin/UsersPermissionsPage.tsx](/home/osos/Desktop/raseed./frontend/src/pages/admin/UsersPermissionsPage.tsx)
     - [frontend/src/pages/admin/ActivityLogsPage.tsx](/home/osos/Desktop/raseed./frontend/src/pages/admin/ActivityLogsPage.tsx)
     - [frontend/src/pages/insights/NotificationsPage.tsx](/home/osos/Desktop/raseed./frontend/src/pages/insights/NotificationsPage.tsx)
     - [frontend/src/pages/insights/AiInsightsPage.tsx](/home/osos/Desktop/raseed./frontend/src/pages/insights/AiInsightsPage.tsx)
     - [frontend/src/pages/super-admin/SupportTicketsPage.tsx](/home/osos/Desktop/raseed./frontend/src/pages/super-admin/SupportTicketsPage.tsx)
   - Risk: mismatch between perceived completeness and actual operational readiness

3. **Development Prisma migration status is not fully healthy**
   - Command failure: `npx prisma migrate status`
   - Risk: local environment consistency issue still unresolved

4. **Testing breadth is too narrow for current feature breadth**
   - Area: backend `returns`, `customers`, `suppliers`, `purchase-orders`, `closing`, `admin`, `subscription`
   - Risk: regressions in untested financial flows

### Low

1. **`curl` health verification was not available because backend was not actively running during this audit**
   - Risk: none to codebase, but runtime was not re-verified live in this turn

2. **Hardware/device configuration is intentionally placeholder**
   - Area: settings hardware section
   - Risk: expectation management only

3. **Support and AI modules are route-complete but not product-complete**
   - Risk: roadmap clarity more than system safety

---

## 12. Recommended next steps

### Must fix before demo

1. Verify the local demo startup path end-to-end on a clean machine
2. Ensure demo credentials work consistently after seeding
3. Avoid showcasing placeholder-only pages as if they are production features
4. Keep barcode printer hardware work in the desktop phase

### Must fix before first paying customer

1. Validate the production CSRF posture for cookie-based auth
2. Add test coverage for returns, suppliers, purchase orders, debts, closing, subscriptions
3. Tighten authorization on roles/permissions listing endpoints
4. Rehearse staging rollout and rollback before a paying-customer launch
5. Resolve Prisma development migration-status issue in a normal local shell if it reappears
6. Run staging deployment, backup/restore drill, and failure-recovery rehearsal

### v1.1 after first customers

1. Real activity logs UI backed by API
2. Real notifications UI
3. Full users/permissions admin UI
4. Subscription upgrade/payment request workflow
5. Better pagination and filtering for large data volumes

### Future advanced features

1. Offline desktop mode with Electron + SQLite sync queue
2. Silent printing and hardware integration
3. Credit sales and partial payment workflows
4. Loyalty / coupons / promotions
5. Real AI insights
6. Advanced accounting and tax tooling

---

## 13. Commands verified

Commands run during this audit and recent verification:

### Backend

- `cd backend && npm run build`
  - Result: **Passed**

- `cd backend && npm test`
  - Result: **Passed**
  - Output summary: `3` suites, `13` tests passed

- `cd backend && npx prisma validate`
  - Result: **Passed**

- `cd backend && npx prisma generate`
  - Result: **Passed**

- `cd backend && npx prisma migrate status`
  - Result: **Failed**
  - Output summary: Prisma schema loaded, datasource resolved to `raseed_dev`, then `Schema engine error`

### Frontend

- `cd frontend && npm run typecheck`
  - Result: **Passed**

- `cd frontend && npm run build`
  - Result: **Passed**
  - Output summary: production build generated successfully

- `cd frontend && npm test`
  - Result: **Passed**
  - Output summary: `2` files, `3` tests passed

### Runtime probe

- `curl -s http://localhost:4000/api/health`
  - Result: **Failed in this audit session**
  - Meaning: backend was not actively serving on that port at the moment of the check; this does not invalidate the implemented endpoint itself

---

## 14. Final verdict

### Is the project demo-ready?

**Yes.**

The project is convincingly demo-ready for real supermarket/store-owner presentations, especially around:

- POS
- inventory sync
- returns
- dashboard
- receipts
- imports
- SaaS admin story

### Is it production-ready?

**Not yet.**

It has strong production groundwork, but I would not honestly label it production-ready yet because of:

 - cookie-based auth/session hardening still needs deployment-specific CSRF review
 - partial placeholder/demo-only frontend areas
 - insufficient test breadth for current business scope
 - barcode hardware printing still depends on browser print CSS
 - deployment-specific recovery drills still need to be rehearsed

### Is it safe to show to a real supermarket owner?

**Yes.**

It is safe to show, provided the demo stays focused on the implemented operational flows and does not oversell placeholder pages as finished product.

### What should be fixed first?

Top priorities:

1. Harden auth/session strategy
2. Replace decorative barcode rendering with a real barcode engine
3. Expand tests for the remaining transactional modules
4. Tighten a few authorization edges
5. Rehearse staging deployment and recovery

---

## Bottom line

Raseed already has more real operational substance than many “demo SaaS” projects. The backend transactional core is its strongest asset. The next phase should not chase more breadth first; it should lock down security, reliability, testing, and a few weak frontend/product edges before calling it production-safe.
