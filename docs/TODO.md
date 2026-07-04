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
- Add automated tests for auth, permissions, tenant isolation, products, categories, inventory transactions, and POS sale rollback behavior.

## Prisma And PostgreSQL

- Keep all store-owned business tables scoped by `storeId`.
- Add `branchId` only where workflows are branch-specific.
- Products and categories now exist as catalog master data.
- Inventory stock, batches, and movements now exist for branch-level stock control.
- POS sales, invoices, payments, held orders, and cashier shifts now exist.
- Do not add advanced returns/refunds, loyalty, coupons, offers, purchase orders, or reports until their dedicated phases.
- Expand seed data only when it supports a real workflow being implemented.

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
- Keep reports, returns, purchase orders, loyalty, and AI services as placeholders until those backend modules exist.
- Expand placeholders into full page UX screen by screen.

## Later Product Areas

- Authentication
- Product/category import and bulk editing
- Inventory transfer and purchase receiving workflows
- Receipt printing polish
- Mixed-payment UX polish
- Offline POS queue
- Returns
- Expenses
- Customers and debts
- Suppliers and purchase orders
- Shift management
- End-of-day closing
- Reports
- Notifications
- AI insights
- Users and permissions
- Activity logs
- Subscription billing
- SaaS super admin
- Electron desktop
- Local SQLite offline mode and sync queue
