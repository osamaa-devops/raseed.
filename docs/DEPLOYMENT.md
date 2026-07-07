# Deployment

## Production stack

Production deployment is prepared with:

- PostgreSQL
- NestJS backend
- React frontend static build
- Nginx reverse proxy

Primary files:

- [backend/Dockerfile](/home/osos/Desktop/raseed./backend/Dockerfile)
- [frontend/Dockerfile](/home/osos/Desktop/raseed./frontend/Dockerfile)
- [docker-compose.production.yml](/home/osos/Desktop/raseed./docker-compose.production.yml)
- [nginx/nginx.conf](/home/osos/Desktop/raseed./nginx/nginx.conf)
- [nginx/conf.d/default.conf](/home/osos/Desktop/raseed./nginx/conf.d/default.conf)

## First-time setup

1. Create `backend/.env.production` from [backend/.env.production.example](/home/osos/Desktop/raseed./backend/.env.production.example).
2. Set strong production values for `DATABASE_URL`, `JWT_SECRET`, and `FRONTEND_URL`.
3. If you will terminate TLS inside nginx, mount certificates into the nginx container and uncomment the TLS lines in [nginx/conf.d/default.conf](/home/osos/Desktop/raseed./nginx/conf.d/default.conf).

## Local development

Local development does not require Docker.

Use the local setup guide in [docs/LOCAL_SETUP.md](/home/osos/Desktop/raseed./docs/LOCAL_SETUP.md) and the npm scripts in the root `package.json`.

## Start production services

```bash
docker-compose -f docker-compose.production.yml up -d --build
```

If your installation uses the newer plugin:

```bash
docker compose -f docker-compose.production.yml up -d --build
```

## Ports

- Nginx public HTTP: `80` by default
- Backend internal: `4000`
- Frontend internal: `8080`
- PostgreSQL internal: `5432`

## Health checks

- External proxy health: `GET /healthz`
- Backend app health: `GET /api/health`
- Backend health now includes a database readiness check and returns degraded state when PostgreSQL is unavailable.
- Frontend container health: `GET /healthz`

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

For Dockerized rollout, run migrations from the backend image or a one-off container with the same production env.
For local development, use `npm run db:migrate` after PostgreSQL is running locally.

## Upgrade flow

1. Pull updated code.
2. Rebuild images.
3. Run `npx prisma migrate deploy`.
4. Restart the stack.
5. Verify `/healthz` and `/api/health`.

## Rollback note

Application rollback is straightforward.
Database rollback is not automatic.
Treat production restores as destructive unless you are restoring into a fresh database.

Before every production migration:

- take a backup first
- confirm restore works in a staging or local recovery database

See [docs/BACKUP.md](/home/osos/Desktop/raseed./docs/BACKUP.md).
