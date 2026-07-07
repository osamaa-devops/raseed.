# Production Checklist

## Before go-live

- [ ] Local PostgreSQL service installed and reachable
- [ ] Production env file created from [backend/.env.production.example](/home/osos/Desktop/raseed./backend/.env.production.example)
- [ ] Strong `JWT_SECRET` configured
- [ ] Strong `LICENSE_SECRET` configured
- [ ] `FRONTEND_URL` set to the exact production origin
- [ ] `DATABASE_URL` points to the production PostgreSQL server only
- [ ] Prisma validate passed
- [ ] Prisma migrations tested in staging or a restore copy
- [ ] Fresh encrypted backup taken from the app
- [ ] Restore from backup tested against a non-production database
- [ ] Backend build passed
- [ ] Backend tests passed when PostgreSQL is running
- [ ] Frontend typecheck passed
- [ ] Frontend build passed
- [ ] Frontend tests passed
- [ ] Desktop build passed

## After go-live

- [ ] Confirm owner login works
- [ ] Confirm POS sale works
- [ ] Confirm shift open/close works
- [ ] Confirm receipt preview/printing still works in the packaged app
- [ ] Confirm backup and restore still work from the app UI
- [ ] Confirm license status is tied to the machine
- [ ] Confirm logs do not expose secrets
- [ ] Confirm `/api/health` works

## Notes

- Docker is optional for deployment work, not for local development.
- Local development should use the host PostgreSQL service and npm scripts.
- Packaged desktop data lives in the Electron user-data directory, not in Docker volumes.
