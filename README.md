# Raseed — رصيد

Raseed is an Arabic RTL POS and retail management SaaS for supermarkets, mini markets, grocery stores, mobile shops, electronics shops, cosmetics shops, and general retail stores.

Release candidate: `v1.0.0-RC1`

This repository is now organized as a local-first full-stack workspace with Electron desktop packaging for Windows.

## Final Stack

- Frontend: React, Vite, TypeScript, Tailwind CSS
- Backend: NestJS, TypeScript
- Database: PostgreSQL
- ORM: Prisma
- Auth: JWT and role-based access control
- Desktop: Electron
- Offline: local PostgreSQL on the host machine or the packaged machine

PostgreSQL + Prisma is the chosen direction because invoices, stock movements, payments, shifts, returns, reports, subscriptions, and permissions need relational consistency and reliable transactions.

## System Requirements

Minimum for local development:

- 2 CPU cores
- 4 GB RAM
- 20 GB disk
- Node.js
- PostgreSQL installed locally

Recommended for a small production deployment:

- 4 CPU cores
- 8 GB RAM
- 40 GB disk
- Windows desktop packaging or another deployment platform for production only

## Ports

- Frontend: `80` in production, `5173` in development
- Backend: `4000`
- PostgreSQL: `5432`
- Nginx health: `/healthz`

## Structure

```text
.
├── frontend
├── backend
├── desktop
├── scripts
├── docs
├── package.json
└── README.md
```

## Production Docs

For deployment and operations, use these guides:

- `docs/LOCAL_SETUP.md`
- `docs/ENVIRONMENT.md`
- `docs/DEPLOYMENT.md`
- `docs/RELEASE_CHECKLIST.md`
- `docs/BACKUP.md`
- `docs/SECURITY.md`
- `docs/PRODUCTION_CHECKLIST.md`

## Local Development

Local development uses the host PostgreSQL service and npm scripts.

Follow the full setup guide in [docs/LOCAL_SETUP.md](/home/osos/Desktop/raseed./docs/LOCAL_SETUP.md).

Development commands:

```bash
sudo systemctl start postgresql
npm install
npm run local:setup
npm run dev
npm run desktop:dev
```

Local verification:

```bash
npm run local:check
npm --prefix backend test
npm --prefix frontend test
npx prisma validate --schema backend/prisma/schema.prisma
```

What the local scripts do:

- `npm run local:check`: checks PostgreSQL reachability, checks `DATABASE_URL`, and validates Prisma schema.
- `npm run local:setup`: checks PostgreSQL, creates the local database if needed, runs Prisma migrations, and runs starter seed only when no Owner/Admin exists yet.
- `npm run desktop:dev`: runs `local:setup`, starts the frontend dev server, and opens Electron. Electron starts the backend automatically.
- `npm run desktop:build`: builds backend and frontend, then packages the Windows installer.

Packaged desktop builds keep their app data under the Electron user-data directory. In development, runtime data stays inside `runtime/` in the repo unless overridden with `RASEED_DATA_DIR`.

Local URLs:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:4000/api`
- Health check: `http://localhost:4000/api/health`

## Frontend

```bash
npm install
npm run dev:frontend
npm run frontend:build
```

The frontend remains Arabic RTL-first, keeps the existing Raseed screens, and supports light/dark mode through shared CSS tokens.

## Backend

```bash
npm install
npm run local:setup
npm run dev
npm run backend:build
```

Health check:

```bash
curl http://localhost:4000/api/health
```

If you use the default example env, the API runs on `http://localhost:4000/api`.

Production checklist:

- Copy `backend/.env.production.example` to `backend/.env.production`
- Set a strong `JWT_SECRET`
- Point `FRONTEND_URL` at the exact HTTPS origin
- Point `DATABASE_URL` at PostgreSQL
- Confirm `UPLOAD_MAX_MB` is appropriate for import files

## Local Shop Credentials

Seeded development users:

| Role | Email | Password |
| --- | --- | --- |
| Super Admin | `admin@raseed.local` | `RaseedAdmin!2026` |
| Owner | `mahmoud@local` | `hello2026` |
| Owner 2 | `owner2@local` | `hello2026` |
| Manager | `manager@raseed.local` | `RaseedManager!2026` |
| Cashier | `ahmed@local` | `hello2026` |
| Cashier 2 | `cashier2@local` | `hello2026` |
| Inventory | `inventory@raseed.local` | `RaseedInventory!2026` |

These are local development credentials only. After the first real setup wizard, the owner account you create becomes the production login.

The app keeps these credentials out of normal user-facing screens. In development mode, the login page can still show a local helper box for fast testing.

The public contact page creates a real support request record that super-admins can review from the platform panel.

## Auth Flow

- `POST /api/auth/login` accepts `identity` and `password`.
- Login returns a short-lived `accessToken`, plus `user`, `store`, `branch`, `role`, and `permissions`.
- Login also sets a refresh token in an `HttpOnly` cookie. The refresh token is never exposed to frontend JavaScript.
- `POST /api/auth/refresh` rotates the refresh token and returns a new short-lived access token.
- `POST /api/auth/logout` revokes the current refresh-token session and clears the cookie.
- The frontend keeps the access token in memory only and restores sessions on page load through `/api/auth/refresh`.
- `GET /api/auth/me` still returns the current auth payload for an already authorized access token.
- Protected backend routes use JWT, role, and permission guards.
- Store users are scoped by `storeId`; branch-specific workflows can use `branchId`.

Default auth timing:

- `ACCESS_TOKEN_EXPIRES_IN=15m`
- `REFRESH_TOKEN_EXPIRES_DAYS=30`

## Database

Local PostgreSQL:

- database: `raseed_dev`
- user: `raseed`
- password: `raseed_password`

Prisma commands:

```bash
npm run db:migrate
npm run db:seed
npm run db:studio
```

If backend integration tests should run fully, start PostgreSQL and prepare a test database:

```bash
sudo systemctl start postgresql
sudo -u postgres createdb raseed_test || true
```

Migration note:

- The auth-session migration is `20260706044500_auth_sessions`.
- If a local database was patched manually and Prisma did not record that migration, verify the live schema matches the migration SQL first, then repair state with `npx prisma migrate resolve --applied 20260706044500_auth_sessions`.
- Avoid manual table creation on Prisma-managed databases unless you are intentionally repairing drift and have a matching migration file to resolve against.

Known limitations:

- Build logs still show dependency deprecation warnings from the existing lockfile.
- Frontend bundle size is acceptable for RC1 but still deserves code-splitting later.
- Silent printing and deeper hardware integration still need more platform-specific hardening.

## Tenancy Rule

Raseed is a multi-tenant SaaS. Store-owned data must be isolated by `storeId`. Branch-specific workflows add `branchId` where needed, especially POS, shifts, stock movements, invoices, returns, and end-of-day closing.

## Current Scope

Implemented in this foundation step:

- NestJS backend shell
- `GET /api/health`
- Global `/api` prefix
- CORS for the frontend
- Validation pipe
- Global exception filter
- Prisma + PostgreSQL setup
- Foundational Prisma models
- JWT login foundation with role/permission guards
- Store-scoped Products and Categories CRUD
- Seeded clothing-ready categories and products for the starter local store
- Frontend Products and Categories pages integrated with the API
- Branch-scoped inventory stock balances and movement history
- Inventory add/remove/adjust flows with transactional stock updates
- Low-stock and expiry alert endpoints
- Frontend Inventory page integrated with the API
- Real POS sale flow with transactional invoices, payments, stock decrement, and `SALE` inventory movements
- Basic cashier shifts and held orders
- Frontend POS, Shifts, and Sales & Invoices pages integrated with the API
- Real returns/refunds V1 with partial/full returns, refund payment records, optional restock, and `RETURN` inventory movements
- Frontend Returns page integrated with invoices and returns history
- Real expenses CRUD with soft delete and activity logs
- Dashboard overview with daily sales, returns, expenses, net sales, estimated profit, payments, low-stock counts, recent invoices, and cashier performance
- JSON reports for sales, profit, payment methods, cashier performance, product sales, inventory value, and expenses
- End-of-day closing summary and immutable daily closing snapshots
- Real customers and customer debt transactions with partial payments and adjustments
- Optional customer link on POS invoices
- Real suppliers with balances, payments, adjustments, and transaction history
- Purchase orders with draft/send/cancel flows and transactional receiving into inventory
- Frontend Suppliers and Purchase Orders pages integrated with the backend API
- SaaS subscription plans, subscription payments, owner subscription visibility, and subscription-based access enforcement
- Super admin overview, stores, plans, subscriptions, and subscription payments APIs
- Frontend super admin dashboard, stores, plans, payments, and owner subscription billing pages integrated with the backend API
- Browser-based receipt printing with per-store/branch receipt settings
- First-run setup wizard for the owner and shop profile
- License activation screen and local encrypted license storage
- Owner-only backup and restore screen with encrypted backups
- Electron bootstrap that waits for the local backend and can relaunch it on crash
- Windows installer packaging via Electron Builder
- Product barcode generation and browser-printable barcode label sheets
- Excel/CSV import and export for products, initial inventory stock, operational lists, and key reports
- Settings page sections for receipts, barcode labels, and future hardware setup
- Dashboard and POS polish for the seeded local store
- Operational walkthrough page at `/help`
- Barcode labels now use a real CODE128 engine through `jsbarcode`, so browser printouts stay scannable instead of decorative

## Windows Install

- Installer target: `release/RaseedSetup.exe`
- Local packaging on Windows: `npm run desktop:build`
- Local packaging on Linux: requires `wine32:i386` for the Windows resource-edit step
- PostgreSQL is still required on the target machine
- First run order: license check, PostgreSQL check, bootstrap, onboarding, login
- Desktop runtime data location: Electron user-data folder
- Backup default location: app data `backups/` folder unless changed from Settings

Not implemented yet:

- Advanced return approvals/cancellations
- PDF export
- Electron desktop, silent printing, and advanced hardware control
- Advanced accounting and tax redistribution
- Credit sale / partially paid invoice workflow
- Loyalty, coupons, and offers
- Online billing provider integration and automated invoicing

## Operational Walkthrough

For a quick operational walkthrough inside the app, open `/help` after logging in.

Suggested order:

1. Login as the owner for `القاسم`
2. Open POS and scan or search a product
3. Complete a sale and preview/print the receipt
4. Open Inventory and show the stock decrease with `SALE` movement
5. Create a return and show the quantity increase
6. Open Dashboard and explain sales, profit, invoices, and top products
7. Open Reports and change the date range
8. Open Import/Export and show Excel import readiness
9. Open Products and preview barcode label printing
10. Login as super admin and show the SaaS control panel

## Barcode Printing

- Barcode format: `CODE128`
- Frontend rendering library: `jsbarcode`
- Barcode labels print correctly in the browser print flow and stay black and white in print CSS
- If a product barcode is missing or invalid, the label preview shows a clear Arabic error instead of a fake barcode
- Thermal/barcode printer hardware support is still a later desktop hardware phase

## Subscription Endpoints

- `GET /api/subscription/me`
- `GET /api/subscription/usage`

Store access is now subscription-aware. Non-super-admin store users are blocked from most protected routes when the store or current subscription is suspended, cancelled, expired, or missing.

## Super Admin SaaS Endpoints

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

## Catalog Endpoints

Products and categories are the first real store-owned business modules. Every request is scoped by the authenticated user's `storeId`.

- `GET /api/categories`
- `GET /api/categories/:id`
- `POST /api/categories`
- `PATCH /api/categories/:id`
- `PATCH /api/categories/:id/status`
- `DELETE /api/categories/:id`
- `GET /api/products`
- `GET /api/products/:id`
- `POST /api/products`
- `PATCH /api/products/:id`
- `PATCH /api/products/:id/status`
- `DELETE /api/products/:id`

Category permissions use `categories.view`, `categories.create`, `categories.update`, and `categories.delete`.
Product permissions use `products.view`, `products.create`, `products.update`, and `products.delete`.

Additional printing/catalog endpoints:

- `POST /api/products/:id/generate-barcode`
- `POST /api/products/barcode-labels`
- `GET /api/settings/receipt`
- `PATCH /api/settings/receipt`
- `GET /api/settings/barcode-labels`
- `PATCH /api/settings/barcode-labels`
- `GET /api/invoices/:id/receipt`

Receipt and label printing use normal browser print preview and print CSS. Silent printing, cash drawer integration, barcode printer drivers, scales, and other direct hardware controls are reserved for the future Electron desktop app.

Migration note: if Prisma reports a blank `Schema engine error` while PostgreSQL is healthy, confirm whether the command is running inside a restricted sandbox that cannot connect to `127.0.0.1:5432`. The receipt/barcode migration was applied normally with Prisma once local database access was allowed; no manual SQL or database reset was used.

## Import And Export

Import/export endpoints live under `/api/import-export` and are scoped to the authenticated user's store. Uploads accept `.xlsx` and `.csv`, are limited to 10 MB and 5,000 rows, validate the full file before writing, and sanitize exported spreadsheet cells that could be interpreted as formulas.

Template endpoints:

- `GET /api/import-export/templates/products.:format`
- `GET /api/import-export/templates/initial-stock.:format`

Import endpoints:

- `POST /api/import-export/products/preview`
- `POST /api/import-export/products/import`
- `POST /api/import-export/initial-stock/preview`
- `POST /api/import-export/initial-stock/import`

Product import supports `CREATE_ONLY` and `UPSERT`, matches existing products by barcode or SKU, and auto-creates missing categories. Initial stock import supports `ADD_TO_EXISTING` and `SET_INITIAL_QUANTITY`, writes stock movements, and creates inventory batches when batch, expiry, or purchase-price data is supplied.

Export endpoints:

- `GET /api/import-export/products`
- `GET /api/import-export/inventory`
- `GET /api/import-export/invoices`
- `GET /api/import-export/expenses`
- `GET /api/import-export/customers`
- `GET /api/import-export/suppliers`
- `GET /api/import-export/reports/daily-sales`
- `GET /api/import-export/reports/profit`
- `GET /api/import-export/reports/inventory-value`

Formats are selected with `format=xlsx` or `format=csv`. Permissions include `data.import`, `data.export`, `products.import`, `products.export`, `inventory.import`, `inventory.export`, and `reports.export`.

## Inventory Endpoints

Product catalog data is store-level, but stock quantity is branch-level. Every stock change must create an `InventoryMovement`; stock should never be updated silently.

- `GET /api/inventory/stocks`
- `GET /api/inventory/stocks/:productId`
- `GET /api/inventory/movements`
- `POST /api/inventory/add-stock`
- `POST /api/inventory/remove-stock`
- `POST /api/inventory/adjust`
- `GET /api/inventory/low-stock`
- `GET /api/inventory/expiry-alerts`

Inventory permissions:

- `inventory.view`
- `inventory.adjust`
- `inventory.add_stock`
- `inventory.remove_stock`
- `inventory.view_movements`
- `inventory.view_alerts`

Seeded inventory examples include low-stock products such as `لبن جهينة`, `زبادي`, and `صابون`, plus near-expiry batches for expiry alert testing.

## Suppliers And Purchase Orders

Suppliers are scoped by `storeId`; purchase orders and received stock are scoped by both `storeId` and `branchId`.

Supplier endpoints:

- `GET /api/suppliers`
- `GET /api/suppliers/:id`
- `POST /api/suppliers`
- `PATCH /api/suppliers/:id`
- `PATCH /api/suppliers/:id/status`
- `DELETE /api/suppliers/:id`
- `GET /api/suppliers/:id/transactions`
- `POST /api/suppliers/:id/payment`
- `POST /api/suppliers/:id/adjust`

Purchase order endpoints:

- `GET /api/purchase-orders`
- `GET /api/purchase-orders/:id`
- `POST /api/purchase-orders`
- `PATCH /api/purchase-orders/:id`
- `PATCH /api/purchase-orders/:id/status`
- `POST /api/purchase-orders/:id/receive`
- `DELETE /api/purchase-orders/:id`

Receiving a purchase order runs in one database transaction. It updates received quantities, increases `InventoryStock`, creates `InventoryMovement` rows of type `PURCHASE`, creates inventory batches when expiry/batch data is supplied, updates purchase-order status, and increases supplier balance only by the unpaid value received in that receive call.

Supplier and purchase-order permissions:

- `suppliers.view`, `suppliers.create`, `suppliers.update`, `suppliers.delete`, `suppliers.pay`, `suppliers.adjust`
- `purchase_orders.view`, `purchase_orders.create`, `purchase_orders.update`, `purchase_orders.cancel`, `purchase_orders.receive`

Manual test path: login as `mahmoud@local`, open Suppliers, create or adjust a supplier, open Purchase Orders, create a draft order, send it, receive part of it, and confirm Inventory movements show `PURCHASE` and the supplier balance increases for unpaid received stock.

## POS And Invoices

`POST /api/pos/sale` creates a paid invoice in one PostgreSQL transaction:

1. Creates the invoice.
2. Creates invoice items with product name, barcode, purchase price, and selling price snapshots.
3. Creates payment rows.
4. Decreases branch inventory stock.
5. Creates `InventoryMovement` rows of type `SALE`.
6. Writes activity logs.

If stock is insufficient or any validation fails, the transaction rolls back and no invoice or stock movement is saved.

POS and invoice endpoints:

- `POST /api/pos/sale`
- `GET /api/pos/recent-invoices`
- `GET /api/pos/held-orders`
- `POST /api/pos/held-orders`
- `DELETE /api/pos/held-orders/:id`
- `GET /api/invoices`
- `GET /api/invoices/:id`
- `GET /api/invoices/by-number/:invoiceNumber`
- `GET /api/shifts/current`
- `POST /api/shifts/open`
- `POST /api/shifts/close`
- `GET /api/shifts`

POS permissions include `pos.access`, `pos.sell`, `pos.hold_order`, `pos.view_recent_invoices`, `shifts.open`, `shifts.close`, `shifts.view`, `invoices.view`, and `invoices.print`.

## Returns And Refunds

Returns are store and branch scoped. A return references an existing invoice and can return one or more invoice items partially or fully. Returned quantity cannot exceed the sold quantity minus previous returns.

`POST /api/returns` runs in one transaction:

1. Creates a return header.
2. Creates return items.
3. Updates `InvoiceItem.returnedQuantity`.
4. Updates invoice status to `PARTIALLY_REFUNDED` or `REFUNDED`.
5. Records a negative refund payment against the invoice.
6. Optionally increases branch inventory stock.
7. Creates `InventoryMovement` rows of type `RETURN` for restocked products.
8. Writes activity logs.

Return endpoints:

- `GET /api/returns`
- `GET /api/returns/:id`
- `GET /api/returns/by-number/:returnNumber`
- `POST /api/returns`

Return permissions include `returns.view`, `returns.create`, `returns.cancel`, `returns.approve`, and `invoices.refund`.

Refund calculation V1 uses the invoice item net line amount proportionally: `refund = returnedQuantity / soldQuantity * item.lineTotal`. Invoice-level discount and tax redistribution are intentionally left for a later accounting pass.

## Expenses, Dashboard, Reports, And Closing

Financial visibility is now backed by PostgreSQL data, still without advanced accounting.

Expense endpoints:

- `GET /api/expenses`
- `GET /api/expenses/:id`
- `POST /api/expenses`
- `PATCH /api/expenses/:id`
- `DELETE /api/expenses/:id`

Expenses are scoped by `storeId` and `branchId`. Delete is a soft delete through `deletedAt`.

Dashboard endpoint:

- `GET /api/dashboard/overview`

Reports endpoints:

- `GET /api/reports/daily-sales`
- `GET /api/reports/monthly-sales`
- `GET /api/reports/profit`
- `GET /api/reports/payment-methods`
- `GET /api/reports/cashier-performance`
- `GET /api/reports/best-selling-products`
- `GET /api/reports/worst-selling-products`
- `GET /api/reports/inventory-value`
- `GET /api/reports/expenses`

End-of-day closing endpoints:

- `GET /api/closing/summary`
- `POST /api/closing/close-day`
- `GET /api/closing/history`

`DailyClosing` stores a snapshot at close time. V1 blocks closing while cashier shifts are still open and does not close shifts automatically.

Financial permissions include `expenses.view`, `expenses.create`, `expenses.update`, `expenses.delete`, `dashboard.view`, `reports.view`, `reports.export`, `closing.view`, and `closing.create`.

## Customers And Debts

Customer data is store-scoped. Debt transactions may also include `branchId` when they happen at a branch. Customer balances are updated only through transaction-based debt operations.

Customer endpoints:

- `GET /api/customers`
- `GET /api/customers/:id`
- `POST /api/customers`
- `PATCH /api/customers/:id`
- `PATCH /api/customers/:id/status`
- `DELETE /api/customers/:id`

Debt endpoints:

- `GET /api/customers/:id/debt-transactions`
- `POST /api/customers/:id/debt/add`
- `POST /api/customers/:id/debt/payment`
- `POST /api/customers/:id/debt/adjust`

Debt behavior:

- `DEBT_ADDED` increases `currentDebt`.
- `PAYMENT_RECEIVED` decreases `currentDebt`.
- `ADJUSTMENT_IN` increases debt.
- `ADJUSTMENT_OUT` decreases debt.
- V1 rejects overpayment and any adjustment that would make debt negative.

Customer/debt permissions include `customers.view`, `customers.create`, `customers.update`, `customers.delete`, `debts.view`, `debts.add`, `debts.pay`, and `debts.adjust`.

POS V1 supports optional `customerId` on `POST /api/pos/sale`, so invoices can be linked to a customer. Credit sales are intentionally deferred; payments must still cover the invoice total.
