# Deployment

## Desktop packaging

Current packaging work is moving toward a Windows desktop app with Electron and a local PostgreSQL database on the user's machine.

Primary files:

- [desktop/main.cjs](/home/osos/Desktop/raseed./desktop/main.cjs)
- [desktop/preload.cjs](/home/osos/Desktop/raseed./desktop/preload.cjs)
- [scripts/dev-desktop.cjs](/home/osos/Desktop/raseed./scripts/dev-desktop.cjs)
- `frontend/dist`
- `backend/dist`

## First-time setup

1. Create `backend/.env.production` from [backend/.env.production.example](/home/osos/Desktop/raseed./backend/.env.production.example).
2. Set strong production values for `DATABASE_URL`, `JWT_SECRET`, and `FRONTEND_URL`.
3. Use the desktop installer or another packaging workflow that matches the environment.

## Local development

Local development uses the host PostgreSQL service and npm scripts.

Use the local setup guide in [docs/LOCAL_SETUP.md](/home/osos/Desktop/raseed./docs/LOCAL_SETUP.md) and the npm scripts in the root `package.json`.

## Start packaged app

Build the backend and frontend and then package the desktop app with Electron Builder.

## Ports

- Backend: `4000`
- Frontend dev server: `5173`
- PostgreSQL: `5432`

## Health checks

- Backend app health: `GET /api/health`
- Backend health includes a database readiness check and returns degraded state when PostgreSQL is unavailable.
- Desktop shell health should rely on the backend health endpoint and local process checks.

## Monitoring placeholders

This phase does not fully implement metrics storage or dashboards, but production is now prepared for:

- uptime checks against `/healthz`
- application checks against `/api/health`
- future Prometheus scraping through an additional metrics endpoint or sidecar
- future Grafana dashboards for uptime, response times, and database health

## Database migrations

Run Prisma migrations before or during rollout:

```bash
cd backend
npx prisma migrate deploy
```

For desktop or local deployment, use `npm run db:migrate` after PostgreSQL is running locally.

## Upgrade flow

1. Pull updated code.
2. Rebuild images.
3. Run `npx prisma migrate deploy`.
4. Restart the app or service wrapper.
5. Verify `/api/health`.

## Rollback note

Application rollback is straightforward.
Database rollback is not automatic.
Treat production restores as destructive unless you are restoring into a fresh database.

Before every production migration:

- take a backup first
- confirm restore works in a staging or local recovery database

See [docs/BACKUP.md](/home/osos/Desktop/raseed./docs/BACKUP.md).
