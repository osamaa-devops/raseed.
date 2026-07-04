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
- Add DTO patterns and module conventions before business CRUD.

## Prisma And PostgreSQL

- Keep all store-owned business tables scoped by `storeId`.
- Add `branchId` only where workflows are branch-specific.
- Add business models in a later phase, not during foundation setup.
- Add seed data for development roles and permissions later.

## Frontend

- Keep Arabic RTL.
- Preserve all current Raseed screens.
- Keep light/dark mode.
- Keep route configuration in `frontend/src/app/routes/routeConfig.tsx`.
- Keep demo-only fixtures in `frontend/src/data/demo`.
- Auth service and login integration now use the backend.
- Keep product/POS/inventory/report services as placeholders until those backend modules exist.
- Expand placeholders into full page UX screen by screen.

## Later Product Areas

- Authentication
- Products CRUD
- Categories CRUD
- Inventory movements
- POS checkout
- Sales and invoices
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
