# TODO

## Immediate

- Keep `npm audit` clean as dependencies evolve.
- Review backend workspace audit findings before production; current fixes require breaking Nest major upgrades.
- Decide whether the workspace should standardize on npm only or keep pnpm metadata.
- Add automated linting and tests.
- Review `frontend/src/app/GeneratedApp.backup.tsx` and migrate any valuable detailed UI pieces into the new page modules.
- Decide when to delete the generated backup after parity is confirmed.

## Backend Foundation

- Add refresh-token persistence and revocation.
- Add password reset and invitation flows.
- Add more complete role/permission management endpoints.
- Expand store/branch guards as business modules are added.
- Add automated tests for auth, permissions, tenant isolation, products, categories, inventory transactions, POS sale rollback behavior, return/refund rollback behavior, expenses, dashboard reports, day closing, and customer debt balance transactions.

## Prisma And PostgreSQL

- Keep all store-owned business tables scoped by `storeId`.
- Add `branchId` only where workflows are branch-specific.
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
- Do not add advanced return approvals/cancellations, loyalty, coupons, offers, advanced accounting, or PDF/Excel exports until their dedicated phases.
- Expand seed data only when it supports a real workflow being implemented.
- Resolve Prisma migration history for `20260705093000_subscriptions_saas_admin` with explicit approval if this local database will continue using Prisma migrate tracking.

## Frontend

- Keep Arabic RTL.
- Preserve all current Raseed screens.
- Keep light/dark mode.
- Keep route configuration in `frontend/src/app/routes/routeConfig.tsx`.
- Keep demo-only fixtures in `frontend/src/data/demo`.
- Auth service and login integration now use the backend.
- Products and categories pages now use the backend API.
- Inventory page now uses real backend stock, movement, and alert APIs.
- POS, shifts, and sales/invoices pages now use real backend APIs.
- Returns page now uses real backend return/refund APIs.
- Expenses, dashboard, reports, and end-of-day closing pages now use real backend APIs.
- Customers and debts page now uses real backend APIs.
- Suppliers page now uses real backend APIs.
- Purchase Orders page now uses real backend APIs for creating, sending, cancelling, and receiving purchase orders.
- POS supports optional customer selection for invoice linking.
- Keep loyalty, AI, and external billing-provider services as placeholders until those backend modules exist.
- Expand placeholders into full page UX screen by screen.

## Later Product Areas

- Authentication
- Product/category import and bulk editing
- Inventory transfer workflow
- Receipt printing polish
- Mixed-payment UX polish
- Offline POS queue
- Return approvals and cancellation workflow
- Expenses polish and attachments
- Customer invoice history UI
- Credit sale and partially paid invoice workflow
- Shift management polish
- End-of-day closing reopen/approval policy
- Report export generation
- Notifications
- AI insights
- Users and permissions
- Activity logs
- Billing provider integration
- Subscription invoice/receipt automation
- Electron desktop
- Local SQLite offline mode and sync queue
