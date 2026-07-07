# Backup

## Scripts

- Backup: [scripts/backup-db.sh](/home/osos/Desktop/raseed./scripts/backup-db.sh)
- Restore: [scripts/restore-db.sh](/home/osos/Desktop/raseed./scripts/restore-db.sh)

Both scripts require `DATABASE_URL`.

## Backup example

```bash
export DATABASE_URL="postgresql://user:password@host:5432/raseed_prod?schema=public"
./scripts/backup-db.sh
```

Custom output path:

```bash
./scripts/backup-db.sh backups/raseed-manual-20260706.sql.gz
```

## Restore example

```bash
export DATABASE_URL="postgresql://user:password@host:5432/raseed_restore?schema=public"
./scripts/restore-db.sh backups/raseed-manual-20260706.sql.gz
```

## Recommended schedule

- Daily full backup at minimum
- Additional pre-deploy backup before every migration or release
- Keep at least:
  - 7 daily backups
  - 4 weekly backups
  - 3 monthly backups

## Operational guidance

- Test restore regularly, not only backup creation.
- Store backup files outside the application host when you move to real infrastructure.
- Encrypt backup files at rest when moving beyond local or staging usage.
- Keep restore drills documented per environment.
- Treat production restores as destructive unless you are targeting a fresh recovery database.

Cloud backup automation is intentionally not implemented in this phase.
