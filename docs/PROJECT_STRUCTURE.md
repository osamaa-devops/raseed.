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
- `frontend/src/services` contains API service placeholders and an optional backend health check helper.
- `frontend/src/services/authService.ts` integrates login and `/auth/me`.
- Product, inventory, sales, reports, and admin business integrations remain placeholders.

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
│   │   ├── products
│   │   ├── categories
│   │   ├── inventory
│   │   ├── sales
│   │   ├── invoices
│   │   ├── returns
│   │   ├── expenses
│   │   ├── reports
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

Auth-related seed data:

- Platform super admin
- Demo store: `ماركت المدينة`
- Main branch: `الفرع الرئيسي`
- Roles: `super_admin`, `owner`, `manager`, `cashier`, `inventory`
- Permission keys for dashboard, POS, products, inventory, sales, invoices, returns, expenses, reports, users, settings, activity logs, and platform admin access

Business entities such as products, invoices, sales, inventory movements, returns, expenses, and reports are intentionally not modeled yet.
