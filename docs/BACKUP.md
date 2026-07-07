# Backup and Restore

Raseed now exposes backup and restore from inside the app for Owner users.

## Where it lives

Open `Settings` and switch to the `الترخيص والنسخ` tab.

## What it does

- Creates encrypted local backup files
- Restores from encrypted backup files
- Stores the last backup time in the local runtime config
- Records backup and restore actions in the audit log

## Backup location

- Development default: `runtime/backups`
- Packaged desktop default: the Electron user-data folder

You can change the backup folder from the settings screen.

## Important notes

- Restore requires Owner access.
- Backups are machine-bound in this version.
- Keep the backup folder outside the active app folder if you want easier manual copies.
- If PostgreSQL is unavailable, backup and restore will fail with a clear error.

## Legacy scripts

The older `scripts/backup-db.sh` and `scripts/restore-db.sh` scripts still exist as operational helpers, but they are no longer the primary local workflow.
