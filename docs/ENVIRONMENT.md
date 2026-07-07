# Environment

Raseed supports three environments:

- `development`
- `test`
- `production`

## Backend

The backend loads environment files in this order:

1. `.env.${NODE_ENV}`
2. `.env`
3. `.env.local`

Environment validation now fails fast on startup when required values are missing or unsafe.

### Required variables

| Variable | Purpose | Notes |
| --- | --- | --- |
| `NODE_ENV` | Runtime mode | `development`, `test`, or `production` |
| `PORT` | Backend HTTP port | Default `4000` |
| `DATABASE_URL` | PostgreSQL connection string | Local dev uses `postgresql://raseed:raseed_password@localhost:5432/raseed_dev?schema=public` |
| `FRONTEND_URL` | Allowed frontend origins | Comma-separated |
| `JWT_SECRET` | JWT signing secret | Minimum 32 chars in production |
| `ACCESS_TOKEN_EXPIRES_IN` | Access token lifetime | Default `15m` |
| `REFRESH_TOKEN_EXPIRES_DAYS` | Refresh token lifetime in days | Default `30` |
| `AUTH_COOKIE_NAME` | Refresh token cookie name | Default `raseed_refresh_token` |
| `AUTH_COOKIE_SECURE` | Secure-cookie flag | Must be `true` in production HTTPS |
| `AUTH_COOKIE_SAME_SITE` | Cookie same-site mode | `lax`, `strict`, or `none` |
| `AUTH_COOKIE_DOMAIN` | Optional cookie domain | Empty by default |
| `UPLOAD_MAX_MB` | Max upload size for import files | Default `10` |
| `THROTTLE_TTL_SECONDS` | Rate-limit window | Default `60` |
| `THROTTLE_LIMIT` | Rate-limit max requests | Default `120` |
| `LOG_LEVEL` | Nest logger levels | Example `log,warn,error` |

### Example files

- Development: [backend/.env.example](/home/osos/Desktop/raseed./backend/.env.example)
- Test: [backend/.env.test.example](/home/osos/Desktop/raseed./backend/.env.test.example)
- Production: [backend/.env.production.example](/home/osos/Desktop/raseed./backend/.env.production.example)

### Local development

Local development uses PostgreSQL installed on the host and npm scripts from the workspace root.

Recommended local backend settings:

- `NODE_ENV=development`
- `PORT=4000`
- `FRONTEND_URL=http://localhost:5173,http://127.0.0.1:5173`
- `DATABASE_URL=postgresql://raseed:raseed_password@localhost:5432/raseed_dev?schema=public`

## Frontend

The frontend currently requires:

| Variable | Purpose | Notes |
| --- | --- | --- |
| `VITE_API_URL` | Base API URL | Use `http://localhost:4000/api` in local dev and `/api` behind nginx in production |

### Example files

- Development: [frontend/.env.example](/home/osos/Desktop/raseed./frontend/.env.example)
- Production: [frontend/.env.production.example](/home/osos/Desktop/raseed./frontend/.env.production.example)

## Production notes

- Never reuse development JWT secrets in production.
- Keep `DATABASE_URL` pointed at the production database only inside production env files or secrets storage.
- Docker is optional for production or staging, not required for local development.
- For Docker production, prefer passing secrets through your deployment platform or an untracked `backend/.env.production`.
- In production, configure `FRONTEND_URL` with the exact HTTPS app origin only, such as `https://app.example.com`.
- Access tokens are intentionally short-lived and should not be persisted in browser storage.
- Refresh tokens are delivered through an `HttpOnly` cookie and are rotated by `/api/auth/refresh`.
- If you deploy cross-site and need `AUTH_COOKIE_SAME_SITE=none`, you must also set `AUTH_COOKIE_SECURE=true`.
- Import and export uploads are capped by `UPLOAD_MAX_MB` and only accept `.xlsx` and `.csv` files.
