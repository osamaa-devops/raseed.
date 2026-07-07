# TODO

## Immediate

- Keep `npm audit` clean as dependencies evolve.
- Review backend workspace audit findings before production; current fixes require breaking Nest major upgrades.
- Decide whether the workspace should standardize on npm only or keep pnpm metadata.
- Add automated linting and tests.
- Add CSRF strategy documentation for auth-cookie deployments if the app is served cross-site.
- Review `frontend/src/app/GeneratedApp.backup.tsx` and migrate any valuable detailed UI pieces into the new page modules.
- Decide when to delete the generated backup after parity is confirmed.

## Backend Foundation

- Add password reset and invitation flows.
- Add user-facing session/device visibility and selective session revocation.
- Add more complete role/permission management endpoints.
- Expand store/branch guards as business modules are added.
- Regression coverage now exists for auth, permissions, tenant isolation, inventory transactions, POS sale rollback behavior, return/refund rollback behavior, supplier payments, purchase orders, closing, subscription blocking/renewal, barcode generation, import/export safety, and activity logs.
- Keep extending test coverage for future customer debt, cashier shift, dashboard, and reporting edge cases as modules evolve.

## Prisma And PostgreSQL

- Keep all store-owned business tables scoped by `storeId`.
- Add `branchId` only where workflows are branch-specific.
- Auth-session migration incident on `raseed_dev` was caused by creating `UserSession` manually before Prisma recorded `20260706044500_auth_sessions` in `_prisma_migrations`.
- The repair was to verify the live `UserSession` table matched `backend/prisma/migrations/20260706044500_auth_sessions/migration.sql` exactly, then mark that migration as applied with Prisma instead of patching the database again.
- Avoid manual schema patches on the dev database; if a migration SQL was already applied out-of-band, use `npx prisma migrate resolve --applied <migration_name>` only after confirming the schema matches the migration file.
- Products and categories now exist as catalog master data.
- Inventory stock, batches, and movements now exist for branch-level stock control.
- POS sales, invoices, payments, held orders, and cashier shifts now exist.
- Returns and refunds now exist with optional restock and returned quantity tracking.
- Expenses and daily closing snapshots now exist.
- Dashboard and reports now read real operational data.
- Customers and debt transactions now exist.
- Suppliers, supplier transactions, purchase orders, and purchase order items now exist.
- Purchase-order receiving now increases inventory stock and supplier balance in one transaction.
- POS invoices can optionally link to a customer; credit sale is deferred.
- Subscription plans, subscription payments, and super-admin CRUD now exist.
- Receipt settings and barcode label settings now exist.
- Product barcode generation and barcode label payloads now exist.
- Invoice receipt payloads now exist for browser-based printing.
- XLSX/CSV import/export now exists for product templates, initial-stock templates, product imports, stock imports, operational exports, and selected report exports.
- Do not add advanced return approvals/cancellations, loyalty, coupons, offers, advanced accounting, or PDF exports until their dedicated phases.
- Expand seed data only when it supports a real workflow being implemented.
- Prisma migration history is currently healthy through `20260706044500_auth_sessions`; run Prisma migrate commands from a normal local shell with PostgreSQL access when working inside a restricted sandbox, because sandboxed Prisma schema-engine calls here could not reach the local database reliably.

## Frontend

- Keep Arabic RTL.
- Preserve all current Raseed screens.
- Keep light/dark mode.
- Keep route configuration in `frontend/src/app/routes/routeConfig.tsx`.
- Keep starter fixtures in `frontend/src/data/demo` only if they remain useful for local testing.
- Auth service and login integration now use the backend.
- Access tokens now live in memory only; refresh-token sessions now use `HttpOnly` cookies with rotation and logout revocation.
- Products and categories pages now use the backend API.
- Inventory page now uses real backend stock, movement, and alert APIs.
- POS, shifts, and sales/invoices pages now use real backend APIs.
- POS and sales/invoices pages now show receipt previews and browser print buttons.
- Returns page now uses real backend return/refund APIs.
- Expenses, dashboard, reports, and end-of-day closing pages now use real backend APIs.
- Customers and debts page now uses real backend APIs.
- Suppliers page now uses real backend APIs.
- Purchase Orders page now uses real backend APIs for creating, sending, cancelling, and receiving purchase orders.
- POS supports optional customer selection for invoice linking.
- Products page now supports barcode generation, product selection, barcode label preview, and browser printing.
- Barcode labels now render a real CODE128 barcode via `jsbarcode`; keep browser-print output black/white and reserve hardware barcode-printer support for the desktop phase.
- Settings page now includes receipt settings, barcode label settings, and a hardware placeholder for future desktop device control.
- Import/export page now supports templates, preview-before-write imports, and XLSX/CSV exports.
- Keep loyalty, AI, and external billing-provider services scoped until those backend modules exist.
- Expand remaining partial screens into full page UX screen by screen.

## Later Product Areas

- Authentication
- Product/category bulk editing
- Inventory transfer workflow
- Receipt printing polish beyond current browser print support
- Electron silent printing and advanced hardware settings
- Mixed-payment UX polish
- Offline POS queue
- Return approvals and cancellation workflow
- Expenses polish and attachments
- Customer invoice history UI
- Credit sale and partially paid invoice workflow
- Shift management polish
- End-of-day closing reopen/approval policy
- PDF report export generation
- Notifications
- AI insights
- Users and permissions
- Activity logs
- Billing provider integration
- Subscription invoice/receipt automation
- Electron desktop
- Local SQLite offline mode and sync queue
