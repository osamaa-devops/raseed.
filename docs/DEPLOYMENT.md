# Deployment

## Local-first development

Raseed is designed to run locally without Docker or Docker Compose.

- PostgreSQL runs as a normal host service
- Backend runs with `npm --prefix backend run dev`
- Frontend runs with `npm --prefix frontend run dev`
- Electron desktop runs with `npm run desktop:dev`

See [docs/LOCAL_SETUP.md](/home/osos/Desktop/raseed./docs/LOCAL_SETUP.md) for the exact Ubuntu setup.

## Windows desktop installer

The Windows build uses Electron Builder and produces `RaseedSetup.exe`.

The packaged app includes:

- `frontend/dist`
- `backend/dist`
- Prisma schema and migrations
- desktop bootstrap files
- runtime scripts needed for local startup

Desktop behavior:

- launches from one icon
- starts the backend automatically
- waits for `/api/health`
- restarts the backend if it crashes
- hides terminal windows on Windows

Build commands:

```bash
npm run backend:build
npm run frontend:build
npm run desktop:build
```

Notes:

- On Windows, `npm run desktop:build` is the main installer command.
- On Linux, the same command needs `wine32:i386` if you want to produce `RaseedSetup.exe`.

## Production database

Production mode still expects a real PostgreSQL server, but Docker is optional and not required for local use.

Recommended desktop and local connection string:

```env
DATABASE_URL=postgresql://raseed:raseed_password@localhost:5432/raseed_dev?schema=public
```

## Data location

- Development runtime data: `runtime/`
- Packaged desktop runtime data: Electron user-data directory
- Logs: local `logs/` folder in development, user-data logs in packaged mode
- Backups: configured from inside the app

## Health checks

- Backend health: `GET /api/health`
- Local bootstrap status: `GET /api/bootstrap/status`
- License status: `GET /api/system/license`

## Troubleshooting

- If the app opens a PostgreSQL error screen, confirm the local PostgreSQL service is running.
- If you copied the app to another PC, the license screen will ask for activation again.
- If the backend crashes immediately, check the local logs folder for the captured error output.
