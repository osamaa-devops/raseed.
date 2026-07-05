# Raseed — رصيد

Raseed is an Arabic RTL POS and retail management SaaS for supermarkets, mini markets, grocery stores, mobile shops, electronics shops, cosmetics shops, and general retail stores.

This repository is now organized as a production-oriented full-stack workspace.

## Final Stack

- Frontend: React, Vite, TypeScript, Tailwind CSS
- Backend: NestJS, TypeScript
- Database: PostgreSQL
- ORM: Prisma
- Auth: JWT and role-based access control
- Desktop later: Electron
- Offline later: local SQLite plus sync queue

PostgreSQL + Prisma is the chosen direction because invoices, stock movements, payments, shifts, returns, reports, subscriptions, and permissions need relational consistency and reliable transactions.

## Structure

```text
.
├── frontend
├── backend
├── docs
├── docker-compose.yml
├── package.json
└── README.md
```

## Frontend

```bash
cd frontend
npm install
npm run dev
npm run build
```

The frontend remains Arabic RTL-first, keeps the existing Raseed screens, and supports light/dark mode through shared CSS tokens.

## Backend

```bash
cd backend
npm install
cp .env.example .env
npx prisma migrate dev
npm run seed
npm run start:dev
npm run build
```

Health check:

```bash
curl http://localhost:4000/api/health
```

If you use the default example env, the API runs on `http://localhost:4000/api`.

## Demo Credentials

Seeded development users:

| Role | Email | Password |
| --- | --- | --- |
| Super Admin | `admin@raseed.local` | `RaseedAdmin!2026` |
| Owner | `owner@raseed.local` | `RaseedOwner!2026` |
| Manager | `manager@raseed.local` | `RaseedManager!2026` |
| Cashier | `cashier@raseed.local` | `RaseedCashier!2026` |
| Inventory | `inventory@raseed.local` | `RaseedInventory!2026` |

These are local development credentials only.

The app no longer exposes these credentials to normal users inside the login screen. In development mode, the login page can show a local helper button, but the canonical source of demo credentials remains this README.

## Auth Flow

- `POST /api/auth/login` accepts `identity` and `password`.
- Login returns `accessToken`, `user`, `store`, `branch`, `role`, and `permissions`.
- The frontend stores this response in `localStorage` for now.
- `GET /api/auth/me` refreshes the current auth payload using the bearer token.
- Protected backend routes use JWT, role, and permission guards.
- Store users are scoped by `storeId`; branch-specific workflows can use `branchId`.

## Database

Start PostgreSQL:

```bash
docker-compose up -d postgres
```

If your Docker installation supports the newer plugin command, this also works:

```bash
docker compose up -d postgres
```

Prisma commands:

```bash
cd backend
npx prisma generate
npx prisma migrate dev
npm run seed
npx prisma studio
```

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
- Seeded demo categories and products for the demo store
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
- Product barcode generation and browser-printable barcode label sheets
- Excel/CSV import and export for products, initial inventory stock, operational lists, and key reports
- Settings page sections for receipts, barcode labels, and future hardware setup
- Demo-ready dashboard and POS polish with visible demo-mode badges for the seeded store
- Internal demo walkthrough page at `/demo-script`

Not implemented yet:

- Advanced return approvals/cancellations
- PDF export
- Electron desktop, silent printing, and advanced hardware control
- Advanced accounting and tax redistribution
- Credit sale / partially paid invoice workflow
- Loyalty, coupons, and offers
- Online billing provider integration and automated invoicing

## Demo Script

For live walkthroughs inside the app, open `/demo-script` after logging in.

Suggested order:

1. Login as the demo owner for `ماركت المدينة`
2. Open POS and scan or search a product
3. Complete a sale and preview/print the receipt
4. Open Inventory and show the stock decrease with `SALE` movement
5. Create a return and show the quantity increase
6. Open Dashboard and explain sales, profit, invoices, and top products
7. Open Reports and change the date range
8. Open Import/Export and show Excel import readiness
9. Open Products and preview barcode label printing
10. Login as super admin and show the SaaS control panel

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

Manual test path: login as `owner@raseed.local`, open Suppliers, create or adjust a supplier, open Purchase Orders, create a draft order, send it, receive part of it, and confirm Inventory movements show `PURCHASE` and the supplier balance increases for unpaid received stock.

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
