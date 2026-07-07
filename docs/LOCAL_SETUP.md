# Local Setup

Raseed runs locally when PostgreSQL is installed on the host machine.

## 1. Install PostgreSQL on Ubuntu

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl enable postgresql
sudo systemctl start postgresql
```

## 2. Create the local database and user

Use the example development credentials:

- database: `raseed_dev`
- user: `raseed`
- password: `raseed_password`

Example setup commands:

```bash
sudo -u postgres psql -c "CREATE USER raseed WITH PASSWORD 'raseed_password';"
sudo -u postgres psql -c "CREATE DATABASE raseed_dev OWNER raseed;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE raseed_dev TO raseed;"
```

## 3. Configure the backend

Copy the example env file and confirm the local connection string:

```bash
cd backend
cp .env.example .env
```

Required local value:

```env
DATABASE_URL=postgresql://raseed:raseed_password@localhost:5432/raseed_dev?schema=public
```

Backend port:

```env
PORT=4000
```

## 4. Run Prisma and start the app

From the repository root:

```bash
npm install
npm run local:check
npm run local:setup
npm run dev
```

If you are running the React app separately, make sure `frontend/.env` contains:

```env
VITE_API_URL=http://localhost:4000/api
```

For the desktop preview shell:

```bash
npm run desktop:dev
```

For a Windows installer build:

```bash
npm run desktop:build
```

Optional Prisma tools:

```bash
npm run db:studio
```

## 5. Verify the app

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:4000/api`
- Health check: `http://localhost:4000/api/health`

The first launch flow will ask for license activation in packaged desktop mode and then show the setup wizard if no owner exists yet.
