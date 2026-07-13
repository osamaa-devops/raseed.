# Windows Installation

## Before installing Raseed

- Use Windows 10 or 11 x64 with a local administrator account. Install and run Raseed initially from that same shop Windows account.
- Keep at least 3 GB free for the first installation.
- Give the customer only `RaseedSetup.exe` and its matching `SHA256SUMS.txt`. Do not run or distribute `win-unpacked`.
- Keep the database on the shop computer. Do not keep it on a USB drive.

## First installation

1. Run `RaseedSetup.exe` as Administrator.
2. The installer verifies and installs its bundled PostgreSQL 17.7 prerequisite, creates a database-specific password, configures the PostgreSQL service, and creates the least-privileged `raseed_app` database user automatically.
3. Start Raseed. It imports the one-time database connection securely, runs database migrations, then shows the first-store setup.
4. Complete the store owner setup, activate the license, set the backup directory, then print a test receipt.
5. Store a verified backup away from the computer before entering real sales.

The installer intentionally stops if it finds an unrelated existing PostgreSQL service. It does not know that server's administrator password and must not alter another program's database. Contact Raseed support to prepare such a device safely. It creates `installation-report.json` beside its support log without passwords.

## Continuous operation

The installer configures the PostgreSQL Windows service to start automatically at boot and to restart after a failure. Raseed itself registers to open automatically when the Windows shop user signs in. The database cannot run while the computer is powered off; use a UPS, disable sleep while plugged in, and configure Windows Update outside shop hours.

## Building a commercial release

The Windows release build refuses to run without a code-signing certificate. Set `CSC_LINK` and `CSC_KEY_PASSWORD` in the release environment. A deliberately unsigned internal test build requires `RASEED_ALLOW_UNSIGNED_RELEASE=true`; it must not be sent to customers. `npm run desktop:build` downloads the pinned PostgreSQL prerequisite, verifies it, builds the installer, creates `SHA256SUMS.txt`, and then verifies that the installer contains all required runtime files.

## Required release checks

- Verify the installer checksum published with the release.
- Verify the bundled PostgreSQL checksum in `resources/prerequisites/postgresql.json`.
- Run a test login after closing and reopening Raseed.
- Open and close a test shift, issue a test sale, then confirm stock and receipt output.
- Test backup restore on a separate non-production database.

## Support data

Application logs are stored in the Windows application-data folder under `Raseed/logs`. Do not send database passwords or unencrypted backups through chat.
