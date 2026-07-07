# Production Checklist

## Before go-live

- [ ] Production env file created from [backend/.env.production.example](/home/osos/Desktop/raseed./backend/.env.production.example)
- [ ] Strong `JWT_SECRET` configured
- [ ] `FRONTEND_URL` set to the exact production origin
- [ ] `DATABASE_URL` points to production PostgreSQL only
- [ ] TLS certificates prepared if nginx terminates HTTPS
- [ ] Prisma migrations tested in staging or restore copy
- [ ] Fresh backup taken
- [ ] Restore script tested against a non-production database
- [ ] `UPLOAD_MAX_MB` set appropriately for import files
- [ ] Backend build passed
- [ ] Backend tests passed
- [ ] Frontend typecheck passed
- [ ] Frontend build passed
- [ ] Frontend tests passed
- [ ] `npx prisma validate` passed
- [ ] `/healthz` and `/api/health` return success after deployment

## After go-live

- [ ] Confirm owner login works
- [ ] Confirm POS sale works
- [ ] Confirm dashboard loads real production data
- [ ] Confirm receipt preview/printing still works in the packaged app
- [ ] Confirm export endpoints still download correctly
- [ ] Confirm backup job schedule is active
- [ ] Confirm logs do not expose secrets
- [ ] Confirm `/api/health` works

## Future operations

- [ ] Add a formal packaging pipeline for Windows installers
- [ ] Add centralized log shipping
- [ ] Add uptime alerting
- [ ] Add metrics collection for Prometheus/Grafana
