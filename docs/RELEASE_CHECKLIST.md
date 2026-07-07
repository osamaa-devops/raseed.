# Release Checklist

Release target: `v1.0.0-RC1`

## Deploy from scratch

- [ ] Clone repository
- [ ] Configure backend environment
- [ ] Configure frontend environment if needed
- [ ] Start PostgreSQL
- [ ] Run Prisma migrations
- [ ] Seed starter data if a fresh install needs it
- [ ] Start backend
- [ ] Start frontend
- [ ] Verify health endpoints
- [ ] Verify login
- [ ] Verify POS
- [ ] Verify reports
- [ ] Verify backup
- [ ] Verify restore

## Operational checks

- [ ] Confirm `GET /api/health` returns `ok`
- [ ] Confirm `/healthz` returns `ok`
- [ ] Confirm owner login works
- [ ] Confirm super admin login works
- [ ] Confirm POS sale works
- [ ] Confirm receipt preview works
- [ ] Confirm barcode labels print correctly
- [ ] Confirm backup and restore scripts work on a non-production database

## RC1 notes

- This RC is intended to prove the stack can be installed on a fresh Ubuntu server.
- Seed data is optional and should only be enabled for fresh local installs or staging environments.
- Production restores should target a fresh database or a dedicated recovery database.
