# Raseed — رصيد

Raseed is an Arabic RTL POS and retail management SaaS for supermarkets, mini markets, grocery stores, mobile shops, electronics shops, cosmetics shops, and general retail stores.

This repository is now organized as a production-oriented full-stack workspace.

## Final Stack

- Frontend: React, Vite, TypeScript, Tailwind CSS
- Backend: NestJS, TypeScript
- Database: PostgreSQL
- ORM: Prisma
- Auth later: JWT and role-based access control
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

If you use the default example env, the API runs on `http://localhost:3000/api`. The current local development `.env` may use another port.

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

Not implemented yet:

- POS logic
- Sales and invoices
- Reports
- Subscription billing

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
