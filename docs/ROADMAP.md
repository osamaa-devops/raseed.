# Roadmap

## Phase 1: Foundation

- Keep the existing Arabic RTL React frontend running.
- Move to a clean `frontend/`, `backend/`, `docs/` workspace.
- Add NestJS backend foundation.
- Add PostgreSQL and Prisma foundation.
- Add health check, CORS, validation, config, and error handling.

## Phase 2: Frontend Architecture

- Continue refining the new route-level pages in `frontend/src/pages`.
- Gradually replace compact placeholders with full production UI while keeping route boundaries stable.
- Keep layouts for public, dashboard, POS, and super admin areas.
- Keep light/dark/system theme behavior and Arabic RTL consistent.
- Remove `GeneratedApp.backup.tsx` only after all useful generated UI details are intentionally migrated.

## Phase 3: Backend Identity And Tenancy

- Extend the new JWT authentication foundation.
- Expand role-based access control into a full UI/management workflow.
- Continue enforcing `storeId` isolation on all store-owned data.
- Add `branchId` scoping for branch-specific workflows.
- Add refresh-token storage and session revocation.
- Add invitation and password reset flows.

## Phase 4: Retail Core Data Model

- Products and categories master data. Completed: first store-scoped CRUD foundation.
- Product/category polish: import/export, barcode validation helpers, richer units, and catalog test coverage.
- Suppliers and purchase orders.
- Customers and debts.
- Inventory movements.
- POS sessions and shifts.
- Sales, invoices, payments, returns, expenses, and end-of-day closing.

## Phase 5: Reporting And Operations

- Sales reports.
- Profit reports.
- Inventory reports.
- Cashier and shift reports.
- Activity logs.
- Notifications.
- AI insights after reliable operational data exists.

## Phase 6: SaaS Platform

- Subscription plans.
- Subscription lifecycle.
- Tenant administration.
- SaaS super admin panel.
- Billing provider integration.

## Phase 7: Desktop And Offline

- Electron desktop shell.
- Local SQLite database.
- Sync queue.
- Conflict handling.
- Offline-safe POS workflows.

## Phase 8: Production Readiness

- Tests.
- CI checks.
- Security hardening.
- Backups.
- Monitoring.
- Deployment configuration.
