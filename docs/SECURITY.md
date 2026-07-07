# Security

## Current protections

### Authentication and authorization

- JWT signing secret is required and validated at startup.
- Production startup fails when `JWT_SECRET` is too short.
- Access tokens are short-lived and kept in frontend memory only.
- Refresh tokens are stored only in `HttpOnly` cookies.
- Refresh tokens are rotated on every successful `/api/auth/refresh`.
- Refresh-token database records store only hashed token values.
- Logout revokes the current refresh-token session and clears the cookie.
- Protected routes use JWT guards and permission guards.
- Admin routes remain permission-gated and super-admin-only at routing level.

### Tenant isolation

- Store-owned modules scope queries by `storeId`.
- Branch workflows use `branchId` when relevant.
- Supplier, purchase-order, inventory, POS, invoice, customer, and report modules are already store-scoped.

### Input validation

- Global Nest validation pipe uses:
  - `whitelist: true`
  - `forbidNonWhitelisted: true`
  - `transform: true`

### Rate limiting

- Global throttling is enabled through `@nestjs/throttler`.
- Login endpoint has a stricter request cap than normal API traffic.
- Health endpoint is excluded so uptime probes are reliable.
- Role and permission listing endpoints now require explicit admin permissions, not just a valid JWT.

### Headers and transport hardening

- Helmet is enabled on the backend.
- Nginx adds security headers and is prepared for HTTPS termination.

### Logging and sensitive data

- Custom application logger redacts likely secrets such as tokens, passwords, and cookies.
- Production exception responses no longer expose internal error details for `5xx`.

### Import/export safety

- Uploads are restricted to `.xlsx` and `.csv`.
- File size limit is enforced in memory upload handling.
- Upload size is configurable through `UPLOAD_MAX_MB`.
- Row count is capped.
- Formula injection mitigation already exists for exported spreadsheet cells.

## Areas reviewed

- JWT handling: acceptable for current stateless access-token phase
- Permission checks: present on protected modules
- Tenant isolation: present in implemented business modules
- Validation: strong baseline
- CORS: origin allowlist now environment-driven
- File uploads: memory-only, extension-limited, size-limited
- Excel import safety: validated and bounded
- Barcode generation: low-risk, internal output only
- Receipt endpoints: protected by auth/permissions
- Admin endpoints: protected by super-admin flow and permissions

## Remaining recommendations

- Move secrets to a dedicated secret manager in real infrastructure.
- Add audit alerts for repeated failed login attempts at the infrastructure or SIEM layer.
- Add object storage and malware scanning if future uploads expand beyond Excel/CSV.
- Consider signed URLs if receipt or export downloads later move to file storage.
- Consider server-side session visibility and device/session management UI for users and super admins.
- Consider CSRF protection strategy if future auth-sensitive endpoints expand beyond same-site browser usage.
