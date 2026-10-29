# MediVerse

MediVerse is a full-stack hospital operations platform using a React/Vite client, Express API, Prisma ORM, and PostgreSQL. Development records are synthetic and must not be used as real clinical data.

## Requirements

- Node.js 20+
- PostgreSQL 15+

## Setup

```powershell
npm install
Copy-Item server\.env.example server\.env
Copy-Item client\.env.example client\.env
```

Set `DATABASE_URL` and `SEED_ADMIN_PASSWORD` in `server/.env`. Create the database, then run:

```powershell
npm run prisma:migrate --workspace server
npm run prisma:seed --workspace server
npm run dev
```

The client runs at `http://localhost:5173`, and the API is available without a login. The development seed creates repeatable synthetic records and an administrator record for database compatibility; no password is required by the application.

The seed also creates repeatable synthetic demo records: 30 patients, 6 doctors, 16 beds, 18 appointments, 8 admissions, 12 medicines, 20 lab orders, and 15 invoices. Demo records use stable `DEMO-*` identifiers, so rerunning the seed updates them instead of creating duplicates.

## API

All application endpoints use `/api/v1` and are available without a login. The API returns `{ data }` for success and `{ error: { code, message } }` for failures. Patients can be updated with `PATCH /api/v1/patients/:id`. Operational records are available from `/appointments`, `/admissions`, `/lab-orders`, and `/invoices`; their status can be changed through each resource's `PATCH /:id/status` endpoint. Discharging an admission also releases its bed.

## Safety

This project uses synthetic demo data, includes no compliance claim, and is not a clinical decision-support system. Configure production secrets outside source control and use a managed deployment/security review before handling sensitive information.
