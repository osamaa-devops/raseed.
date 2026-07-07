# Raseed Project Status Report

Date: 2026-07-08

## Main idea

Raseed is an Arabic RTL, offline-first POS and store management system for real retail shops, with the strongest fit around clothing stores.

The target shape of the product is:

- a local desktop app that runs on Windows
- a backend that talks to local PostgreSQL
- a role-based flow for Owner, Manager, Cashier, Inventory Staff, and Super Admin
- fast cashier sales, stock control, returns, closing, reports, backup/restore, and licensing
- a SaaS layer for multi-store administration when the platform is used beyond one shop

## Intended deployment shape

The most important real-world target for the current `dev` branch is a single-store, local-only deployment:

- one shop
- one local PostgreSQL database on the shop machine
- one or more PCs on the same shop network if needed
- cashier accounts with limited access
- owner accounts with wider access
- printer and scanner connected locally to the shop machine or adjacent workstation
- no Docker required for day-to-day use

That means the branch is meant to be installed, activated, and used like a normal offline shop system rather than a cloud SaaS app during daily operations.

For the concrete shop-install flow, use [docs/SHOP_DEPLOYMENT_CHECKLIST.md](/home/osos/Desktop/raseed./docs/SHOP_DEPLOYMENT_CHECKLIST.md).

## Executive summary

The project is a strong operational MVP / release-candidate foundation, not a fully production-ready system yet.

The core POS business flows are implemented across backend and frontend: auth, products, categories, inventory, POS sales, invoices, returns, expenses, customers/debts, suppliers, purchase orders, shifts, closing, reports, subscriptions, super-admin stores/plans/payments, receipt printing, barcode labels, import/export, backup/restore hooks, licensing hooks, and Electron packaging.

Super admin store creation already exists. From `/super-admin/stores`, the platform admin can create a store, main branch, owner user, and subscription in one backend transaction through `POST /api/admin/stores`.

The seed also already creates the first starter local shop and a practical account set:

- Store: `القاسم`
- Main branch: `الفرع الرئيسي`
- Super admin: `admin@raseed.local` / `RaseedAdmin!2026`
- Owner: `mahmoud@local` / `hello2026`
- Additional owner: `owner2@local` / `hello2026`
- Cashier: `ahmed@local` / `hello2026`
- Additional cashier: `cashier2@local` / `hello2026`
- Manager and inventory users, starter stock, starter invoices, starter returns, customers, suppliers, and reports data

## Where we have reached

The core business system is now present across backend and frontend, and the app can be used as a real local POS foundation rather than a mock shell.

What is already working at a practical level:

- authentication and refresh-token sessions
- role and permission enforcement
- store and branch scoping for core business data
- products, categories, inventory, POS sales, invoices, returns, expenses, customers/debts, suppliers, purchase orders, shifts, closing, and reports
- browser receipt printing and barcode label printing
- super admin store creation and SaaS administration
- real public contact-request capture with super-admin review
- first-run owner setup, backup/restore hooks, license activation hooks, and Electron packaging
- local-first development scripts and PostgreSQL-based setup

That means the project is no longer “just an idea”. It is a functioning retail platform with a lot of the real operational backbone already implemented.

## Verification run

Commands that passed:

- `npm --prefix backend run typecheck`
- `npm --prefix frontend run typecheck`
- `npm --prefix backend run build`
- `npm --prefix frontend run build`
- `npm --prefix frontend test`
- `npx prisma validate --schema backend/prisma/schema.prisma`

Backend tests did not run against real PostgreSQL because the local PostgreSQL test database is unavailable. The Jest setup skipped 5 backend suites and 23 tests with a clear message asking for `TEST_DATABASE_URL` or a local PostgreSQL database containing `test` in its name.

`npm run local:check` failed because PostgreSQL is not running on `localhost:5432`.

Attempting to start PostgreSQL from this session required a sudo password, so the database setup/seed could not be executed here.

## Workspace note

The current workspace includes the starter account updates, the shop deployment checklist, and the status-report edits in this repository.

The seed work now includes variant barcode mapping plus a practical local shop account set for owners and cashiers.

## Store creation status

Implemented backend:

- `GET /api/admin/stores`
- `GET /api/admin/stores/:id`
- `POST /api/admin/stores`
- `PATCH /api/admin/stores/:id`
- `PATCH /api/admin/stores/:id/status`

Implemented frontend:

- `/super-admin/stores`
- "متجر جديد" modal
- Inputs for store name, owner, phone, email, plan, billing cycle, owner login, owner password, main branch name, and branch address

When the super admin creates a store, the backend creates:

- Store
- Main/default branch
- Owner role for that store
- Owner user
- Subscription
- Activity log entry

## What is ready for real use

- Auth with access tokens and rotated HttpOnly refresh-token sessions
- Role and permission guards
- Tenant scoping by `storeId` in implemented business modules
- Products/categories CRUD
- Inventory balances, movements, low-stock, expiry alerts
- POS sale transaction with invoice/payment/stock decrement
- Held orders
- Shifts and end-of-day closing
- Invoice listing and receipt payloads
- Returns/refunds with optional restock
- Expenses
- Dashboard and reports
- Customers and debt transactions
- Suppliers and purchase orders
- Subscription plans, subscriptions, and payments
- Super-admin dashboard, stores, plans, and payments
- Receipt settings and browser printing
- Barcode generation and label printing
- Import/export for supported templates and operational data
- Production-oriented docs/checklists are present

## What is still missing before production

High priority:

- Run backend e2e tests against real PostgreSQL with a prepared test database.
- Validate the full first-run flow on a clean Windows machine:
  - PostgreSQL present
  - app starts
  - license activation works
  - owner setup works
  - login works
  - backend restarts cleanly after a crash
- Verify the Windows installer path end-to-end on the target OS:
  - installer output
  - desktop shortcut
  - Start Menu shortcut
  - first launch
- Test the full business loop manually on real data:
  - create store
  - create products and variants
  - open shift
  - sell
  - print receipt
  - return
  - close day
- Test backup and restore on a non-production database, then repeat the restore on Windows.
- Decide and document the final CSRF strategy for cookie-based auth in the production topology.
- Confirm production secrets are strong and not committed.
- Decide the exact anti-piracy policy for the commercial release. The current licensing layer can bind activation to a machine fingerprint and require reactivation on another PC, but no offline desktop app can make copying mathematically impossible.

Medium priority:

- Add branch management UI for store owners.
- Add inventory transfer workflow between branches.
- Add user session/device management UI.
- Add password reset and invitation flows.
- Add credit/partial-payment sale workflow.
- Add subscription upgrade/request/payment-provider integration.
- Add support tickets backend/frontend.
- Replace notification preview data with live operational alerts.
- Add code splitting for the frontend bundle; current production build warns about a chunk over 500 KB.

Lower priority:

- AI insights remain an open product area.
- Hardware/device controls remain an open product area.
- Silent printing and deeper device integration need platform testing.
- Product image upload/storage is not implemented.
- PDF report export is not implemented.
- Offline sync queue is not part of the current local-first PostgreSQL model.
- Perfect copy protection is not realistic for any offline desktop app; the practical goal is machine-bound activation, encrypted local license storage, and operational friction for reuse on another machine.

## Recommended next steps

1. Start PostgreSQL locally and run:

```bash
npm run local:setup
npm run local:check
npm --prefix backend test
```

2. Log in as the seeded super admin:

```text
admin@raseed.local
RaseedAdmin!2026
```

3. Open `/super-admin/stores` and create a real first store if you do not want to use the seeded starter store.

4. Log in as the new owner and test the operational flow:

- Add category/product
- Add stock
- Open shift
- Create POS sale
- Print receipt preview
- Create return
- Close day
- Export report

5. Before real customer deployment, complete the high-priority production items above.
6. For the exact shop install flow, follow [docs/SHOP_DEPLOYMENT_CHECKLIST.md](/home/osos/Desktop/raseed./docs/SHOP_DEPLOYMENT_CHECKLIST.md).

## Short answer: what is missing

If you want the shortest possible version, this is the remaining gap:

- real Windows machine testing
- fully verified installer output
- PostgreSQL test DB setup for automated backend tests
- final backup/restore drill on Windows
- final CSRF/security documentation for cookie auth
- a few product polish items like PDF exports, product images, and support tooling

Everything else is already much closer to a working shop system than a prototype.

## Implementation update - production-readiness pass

Completed in this pass:

- Replaced the preview-only users/permissions page with a real API-connected user management page.
- Added user create/edit/status workflows in the frontend.
- Connected roles and branches into the user form.
- Added a real activity logs read API with filters and pagination.
- Replaced the preview activity logs page with a real API-connected page.
- Added owner/admin branch management UI for listing, creating, editing, activating, and deactivating branches.
- Added branch status activity logging.
- Replaced preview notifications with operational alerts from existing inventory, expiry, customer debt, and subscription APIs.
- Added frontend route-level lazy loading, which removed the previous Vite bundle warning over 500 KB.

Files changed in this pass:

- `backend/src/modules/activity-logs/activity-logs.controller.ts`
- `backend/src/modules/activity-logs/activity-logs.module.ts`
- `backend/src/modules/activity-logs/activity-logs.service.ts`
- `backend/src/modules/activity-logs/dto/activity-logs-query.dto.ts`
- `backend/src/modules/branches/branches.service.ts`
- `backend/src/modules/permissions/permissions.controller.ts`
- `backend/src/modules/roles/roles.controller.ts`
- `frontend/src/app/routes/AppRoutes.tsx`
- `frontend/src/app/routes/accessControl.ts`
- `frontend/src/app/routes/routeConfig.tsx`
- `frontend/src/components/navigation/navigationConfig.ts`
- `frontend/src/data/demo/demoUsers.ts`
- `frontend/src/pages/admin/ActivityLogsPage.tsx`
- `frontend/src/pages/admin/BranchesPage.tsx`
- `frontend/src/pages/admin/UsersPermissionsPage.tsx`
- `frontend/src/pages/insights/NotificationsPage.tsx`
- `frontend/src/services/activityLogsService.ts`
- `frontend/src/services/branchesService.ts`
- `frontend/src/services/permissionsService.ts`
- `frontend/src/services/rolesService.ts`
- `frontend/src/services/usersService.ts`
- `frontend/src/types/index.ts`

Verification after this pass:

- `npm --prefix backend run typecheck` passed.
- `npm --prefix frontend run typecheck` passed.
- `npm --prefix backend run build` passed.
- `npm --prefix frontend run build` passed.
- `npm --prefix frontend test` passed.
- `npx prisma validate --schema backend/prisma/schema.prisma` passed.
- `npm --prefix backend test` completed with exit code 0, but all backend suites were skipped because PostgreSQL test database is unavailable.

Database migrations:

- No Prisma schema changes were made in this pass.
- No new migration is required for these changes.

Environment variables:

- No new environment variables are required for this pass.
- Backend e2e tests still need `TEST_DATABASE_URL` pointing to a PostgreSQL database whose name includes `test`.

Still partial/TODO:

- Credit and partial-payment sales.
- Password reset and invitation flows.
- Support tickets backend/frontend.
- Product image upload/storage.
- PDF report exports.
- Backup scheduler and backup metadata tracking.
- Full backend e2e execution against PostgreSQL.

## Implementation update - inventory transfer pass

Completed in this pass:

- Added persistent inventory transfer tracking with `InventoryTransfer`.
- Added `InventoryTransferStatus` enum.
- Added `POST /api/inventory/transfer`.
- Added `GET /api/inventory/transfers`.
- Transfers validate:
  - source and destination branches belong to the current store
  - source and destination are different
  - source branch has enough stock
  - product belongs to the current store
  - optional variant belongs to the product
- A completed transfer now updates both branch stock balances in one transaction.
- A transfer creates both movement records:
  - `TRANSFER_OUT` on source branch
  - `TRANSFER_IN` on destination branch
- A transfer creates an activity log entry.
- Added `inventory.transfer` permission to core permissions and relevant seeded roles.
- Added frontend transfer workflow in the Inventory page.
- Added Transfers tab in the Inventory page.

Files changed in this pass:

- `backend/prisma/schema.prisma`
- `backend/prisma/migrations/20260708120000_inventory_transfers/migration.sql`
- `backend/src/bootstrap/bootstrap-core.ts`
- `backend/src/modules/inventory/dto/create-inventory-transfer.dto.ts`
- `backend/src/modules/inventory/dto/get-inventory-transfers-query.dto.ts`
- `backend/src/modules/inventory/inventory.controller.ts`
- `backend/src/modules/inventory/inventory.service.ts`
- `frontend/src/pages/inventory/InventoryPage.tsx`
- `frontend/src/services/inventoryService.ts`
- `frontend/src/types/index.ts`

Verification after this pass:

- `npm --prefix backend run prisma:generate` passed.
- `npm --prefix backend run typecheck` passed.
- `npm --prefix frontend run typecheck` passed.
- `npm --prefix backend run build` passed.
- `npm --prefix frontend run build` passed.
- `npm --prefix frontend test` passed.
- `npx prisma validate --schema backend/prisma/schema.prisma` passed.
- `npm --prefix backend test` completed with exit code 0, but all backend suites were skipped because PostgreSQL test database is unavailable.

Database migrations:

- Run `npm run db:migrate` or `npm --prefix backend run prisma:migrate` to apply `20260708120000_inventory_transfers`.
- Run seed or permission sync after migration so existing roles receive `inventory.transfer`.

Environment variables:

- No new environment variables are required for inventory transfers.
