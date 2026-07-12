# Windows Installation

## Before installing Raseed

- Use Windows 10 or 11 x64 with a local administrator account.
- Install a supported local PostgreSQL server. The PostgreSQL command-line tools `psql`, `createdb`, and `pg_dump` must be available.
- Keep the database on the shop computer. Do not keep it on a USB drive.

## First installation

1. Run `RaseedSetup.exe`.
2. Open an elevated PowerShell window and run `Initialize-Raseed.ps1 -PreventSleep` from the installed application's `resources/support` folder.
3. Start Raseed. It runs database migrations before showing the first-store setup.
4. Complete the store owner setup, activate the license, set the backup directory, then print a test receipt.
5. Store a verified backup away from the computer before entering real sales.

## Continuous operation

`Initialize-Raseed.ps1` configures the PostgreSQL Windows service to start automatically at boot and to restart after a failure. Raseed itself registers to open automatically when the Windows shop user signs in. The database cannot run while the computer is powered off; use a UPS, disable sleep while plugged in with `-PreventSleep`, and configure Windows Update outside shop hours.

## Building a commercial release

The Windows release build refuses to run without a code-signing certificate. Set `CSC_LINK` and `CSC_KEY_PASSWORD` in the release environment. A deliberately unsigned internal test build requires `RASEED_ALLOW_UNSIGNED_RELEASE=true`; it must not be sent to customers. The build creates `SHA256SUMS.txt` beside `RaseedSetup.exe`.

## Required release checks

- Verify the installer checksum published with the release.
- Run a test login after closing and reopening Raseed.
- Open and close a test shift, issue a test sale, then confirm stock and receipt output.
- Test backup restore on a separate non-production database.

## Support data

Application logs are stored in the Windows application-data folder under `Raseed/logs`. Do not send database passwords or unencrypted backups through chat.
