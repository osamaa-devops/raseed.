# Project Structure

## Root

```text
.
├── frontend
│   ├── src
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
├── backend
│   ├── src
│   ├── prisma
│   ├── package.json
│   └── .env.example
├── docs
│   ├── PROJECT_STRUCTURE.md
│   ├── ROADMAP.md
│   └── TODO.md
├── docker-compose.yml
├── package.json
├── package-lock.json
├── pnpm-workspace.yaml
└── README.md
```

## Frontend

The existing Raseed React app lives in `frontend/`.

```text
frontend/src
├── app
│   ├── App.tsx
│   ├── GeneratedApp.backup.tsx
│   ├── providers
│   │   ├── AuthProvider.tsx
│   │   └── ThemeProvider.tsx
│   └── routes
│       ├── AppRoutes.tsx
│       ├── ProtectedRoute.tsx
│       └── routeConfig.tsx
├── components
│   ├── dashboard
│   ├── feedback
│   ├── forms
│   ├── navigation
│   ├── pos
│   ├── tables
│   ├── theme
│   └── ui
├── data
│   └── demo
├── hooks
├── layouts
│   ├── DashboardLayout.tsx
│   ├── PosLayout.tsx
│   ├── PublicLayout.tsx
│   └── SuperAdminLayout.tsx
├── pages
│   ├── admin
│   ├── dashboard
│   ├── finance
│   ├── insights
│   ├── inventory
│   ├── onboarding
│   ├── pos
│   ├── products
│   ├── public
│   ├── reports
│   ├── sales
│   ├── shifts
│   ├── suppliers
│   └── super-admin
├── routes
├── services
├── stores
├── styles
├── types
└── utils
```

Current state:

- `frontend/src/app/App.tsx` now mounts providers and React Router.
- `frontend/src/app/providers/AuthProvider.tsx` stores the current local auth session.
- `frontend/src/app/routes/ProtectedRoute.tsx` protects store and super-admin routes.
- `frontend/src/app/GeneratedApp.backup.tsx` keeps the old Figma-generated single-file app as a temporary reference.
- `frontend/src/app/routes/routeConfig.tsx` contains the route table.
- `frontend/src/layouts` contains public, dashboard, POS, and super-admin layouts.
- `frontend/src/pages` contains route-level page modules for every current Raseed screen.
- `frontend/src/components/ui` contains generated reusable UI primitives.
- `frontend/src/components/navigation` contains the dashboard and super-admin navigation.
- `frontend/src/styles` contains Arabic RTL, Tailwind, and light/dark theme foundations.
- `frontend/src/data/demo` contains static UI preview data.
- `frontend/src/services` contains API clients and route-level service modules.
- `frontend/src/services/authService.ts` integrates login and `/auth/me`.
- `frontend/src/services/productsService.ts` integrates store-scoped product CRUD.
- `frontend/src/services/categoriesService.ts` integrates store-scoped category CRUD.
- `frontend/src/services/inventoryService.ts` integrates branch-scoped inventory stock, movements, and alerts.
- `frontend/src/services/posService.ts` integrates sale creation, recent invoices, and held orders.
- `frontend/src/services/shiftsService.ts` integrates cashier shift open/close/history.
- `frontend/src/services/invoicesService.ts` integrates invoice listing and details.
- `frontend/src/services/returnsService.ts` integrates returns and refunds.
- `frontend/src/services/expensesService.ts` integrates expenses CRUD.
- `frontend/src/services/dashboardService.ts` integrates the owner dashboard overview.
- `frontend/src/services/reportsService.ts` integrates JSON operational reports.
- `frontend/src/services/closingService.ts` integrates end-of-day summary, close-day, and history.
- Advanced admin business integrations such as purchase orders, debts, AI, and billing remain placeholders.

## Frontend Routes

Public routes:

- `/`
- `/login`
- `/request-demo`
- `/onboarding`

Store routes:

- `/dashboard`
- `/pos`
- `/shifts`
- `/closing`
- `/products`
- `/categories`
- `/inventory`
- `/sales`
- `/returns`
- `/expenses`
- `/reports`
- `/suppliers`
- `/purchase-orders`
- `/customers-debts`
- `/notifications`
- `/ai-insights`
- `/users-permissions`
- `/activity-logs`
- `/subscription-billing`
- `/help`
- `/settings`

Super admin routes:

- `/super-admin`
- `/super-admin/stores`
- `/super-admin/plans`
- `/super-admin/payments`
- `/super-admin/support`

## Theme System

Theme state lives in `frontend/src/app/providers/ThemeProvider.tsx`.

- Supports `light`, `dark`, and `system` preferences.
- Stores the preference in `localStorage`.
- Applies `.dark` on the document element.
- Keeps `lang="ar"` and `dir="rtl"` active.
- Uses semantic CSS tokens in `frontend/src/styles/theme.css`.

## Backend

The NestJS API lives in `backend/`.

```text
backend
├── src
│   ├── main.ts
│   ├── app.module.ts
│   ├── modules
│   │   ├── auth
│   │   ├── users
│   │   ├── stores
│   │   ├── branches
│   │   ├── dashboard
│   │   ├── products
│   │   ├── categories
│   │   ├── inventory
│   │   ├── sales
│   │   ├── invoices
│   │   ├── returns
│   │   ├── expenses
│   │   ├── reports
│   │   ├── closing
│   │   ├── suppliers
│   │   ├── customers
│   │   ├── subscriptions
│   │   ├── admin
│   │   ├── activity-logs
│   │   ├── notifications
│   │   ├── settings
│   │   └── health
│   ├── common
│   │   ├── guards
│   │   ├── decorators
│   │   ├── filters
│   │   ├── interceptors
│   │   ├── pipes
│   │   └── utils
│   └── prisma
└── prisma
    ├── schema.prisma
    ├── seed.ts
    └── migrations
```

Current backend implementation:

- `GET /api/health`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`
- `POST /api/auth/refresh`
- `GET /api/users`
- `GET /api/users/:id`
- `POST /api/users`
- `PATCH /api/users/:id`
- `PATCH /api/users/:id/status`
- `GET /api/users/:id/permissions`
- `GET /api/stores/me`
- `PATCH /api/stores/me`
- `GET /api/admin/stores`
- `GET /api/admin/stores/:id`
- `POST /api/admin/stores`
- `PATCH /api/admin/stores/:id/status`
- `GET /api/branches`
- `POST /api/branches`
- `PATCH /api/branches/:id`
- `PATCH /api/branches/:id/status`
- `GET /api/roles`
- `GET /api/permissions`
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
- `GET /api/inventory/stocks`
- `GET /api/inventory/stocks/:productId`
- `GET /api/inventory/movements`
- `POST /api/inventory/add-stock`
- `POST /api/inventory/remove-stock`
- `POST /api/inventory/adjust`
- `GET /api/inventory/low-stock`
- `GET /api/inventory/expiry-alerts`
- `GET /api/shifts/current`
- `POST /api/shifts/open`
- `POST /api/shifts/close`
- `GET /api/shifts`
- `POST /api/pos/sale`
- `GET /api/pos/recent-invoices`
- `GET /api/pos/held-orders`
- `POST /api/pos/held-orders`
- `DELETE /api/pos/held-orders/:id`
- `GET /api/invoices`
- `GET /api/invoices/:id`
- `GET /api/invoices/by-number/:invoiceNumber`
- `GET /api/returns`
- `GET /api/returns/:id`
- `GET /api/returns/by-number/:returnNumber`
- `POST /api/returns`
- `GET /api/expenses`
- `GET /api/expenses/:id`
- `POST /api/expenses`
- `PATCH /api/expenses/:id`
- `DELETE /api/expenses/:id`
- `GET /api/dashboard/overview`
- `GET /api/reports/daily-sales`
- `GET /api/reports/monthly-sales`
- `GET /api/reports/profit`
- `GET /api/reports/payment-methods`
- `GET /api/reports/cashier-performance`
- `GET /api/reports/best-selling-products`
- `GET /api/reports/worst-selling-products`
- `GET /api/reports/inventory-value`
- `GET /api/reports/expenses`
- `GET /api/closing/summary`
- `POST /api/closing/close-day`
- `GET /api/closing/history`
- global `/api` prefix
- CORS
- validation pipe
- global exception filter
- Prisma service
- JWT auth guard
- roles guard
- permissions guard
- tenant scope utility type

## Database

PostgreSQL runs locally through `docker-compose.yml`.

Prisma foundational models:

- `Store`
- `Branch`
- `User`
- `Role`
- `Permission`
- `RolePermission`
- `UserPermission`
- `SubscriptionPlan`
- `Subscription`
- `ActivityLog`
- `Category`
- `Product`
- `InventoryStock`
- `InventoryMovement`
- `InventoryBatch`
- `CashierShift`
- `Invoice`
- `InvoiceItem`
- `Payment`
- `HeldOrder`
- `Return`
- `ReturnItem`
- `Expense`
- `DailyClosing`

Auth-related seed data:

- Platform super admin
- Demo store: `ماركت المدينة`
- Main branch: `الفرع الرئيسي`
- Roles: `super_admin`, `owner`, `manager`, `cashier`, `inventory`
- Permission keys for dashboard, POS selling, held orders, shifts, categories, products, inventory, inventory stock actions, sales, invoices, invoice refunds, returns, expenses CRUD, reports/export, closing view/create, users, settings, activity logs, and platform admin access
- Demo product categories and products for local frontend/API validation
- Demo branch-level stock balances, opening inventory movements, and near-expiry batches for `ماركت المدينة`

Products and categories are catalog master data. Inventory owns branch-level stock balances and movement history. POS creates paid invoices, payment rows, and `SALE` inventory movements transactionally. Returns create return records, refund payment rows, optional restocks, and `RETURN` inventory movements transactionally. Expenses are branch-scoped and soft-deleted. Dashboard and reports read operational data as JSON. End-of-day closing saves a `DailyClosing` snapshot and blocks closing while shifts are still open.
