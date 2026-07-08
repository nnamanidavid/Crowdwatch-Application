# Crowdwatch

A real-time local incident reporting platform. Users report incidents
(text, photo, location), and nearby subscribers get notified automatically.

This repo contains the full application — 5 backend microservices and a
React frontend. Infrastructure (Terraform, Kubernetes manifests, CI/CD)
is intentionally **not** included here — that's a separate, deliberate
layer built on top of this code.

## Architecture

```
                        ┌─────────────┐
   Browser ───────────► │   Gateway   │
                        └──────┬──────┘
                               │
        ┌──────────────┬───────┴──────┬──────────────┐
        ▼              ▼              ▼              │
   Auth Service   Reports Service  Media Service      │
        │              │              │               │
        ▼              ▼              ▼               │
   Auth DB       Reports DB (PostGIS) Media DB         │
                       │                               │
                       ▼                               │
                  SQS (new_report_created)              │
                       │                               │
                       ▼                               │
              Notification Service ◄────────────────────
                       │
                       ▼
                Notification DB
```

Full architecture and infrastructure documents (with diagrams) covering
the reasoning behind each design decision are available separately —
ask if you need them re-shared.

## Folder Structure

```
crowdwatch/
├── docker-compose.yml       # Spins up the entire stack locally
├── .env.example             # Copy to .env before running
├── localstack-init/         # Auto-creates local SQS queue + S3 bucket
├── auth-service/            # Signup, login, JWT issuing
├── reports-service/         # Incident CRUD + geo radius search
├── media-service/           # S3 presigned uploads
├── notification-service/    # SQS consumer, sends alerts
├── gateway-service/         # Single entry point, JWT check, proxy
└── frontend/                # React + Vite + Leaflet map UI
```

Each service folder has its own `README.md` covering its routes,
environment variables, and setup — this file is the entry point that
ties them all together.

## Running Everything Locally

You need Docker and Docker Compose installed. Nothing else — no AWS
account, no real Postgres install. LocalStack simulates SQS and S3 so
the whole system runs end-to-end on your machine.

### 1. One-time setup

```bash
cp .env.example .env
# Edit .env and set a real JWT_SECRET if you want (a dev default is provided)
```

**Add one line to your hosts file** (required for photo uploads to work
in the browser — see "Why this is needed" below):

- macOS/Linux: add to `/etc/hosts`
- Windows: add to `C:\Windows\System32\drivers\etc\hosts` (as Administrator)

```
127.0.0.1  localstack
```

### 2. Build and start everything

```bash
docker compose up --build
```

This starts, in order: 4 Postgres databases, LocalStack, all 5 backend
services, and the frontend. First run takes a few minutes while images build.

### 3. Run migrations (one time, after containers are up)

Each service needs its database tables created once:

```bash
docker compose exec auth-service node src/db/migrate.js
docker compose exec reports-service node src/db/migrate.js
docker compose exec media-service node src/db/migrate.js
docker compose exec notification-service node src/db/migrate.js
```

### 4. Open the app

Frontend: **http://localhost:8080**
Gateway API directly: **http://localhost:3004**

Sign up, drop a pin, submit a report — refresh the map and it should
appear. Check `docker compose logs -f notification-service` to see the
mock alert get logged when a report is created near a subscription.

## Why the `/etc/hosts` entry is needed

Media Service generates S3 upload URLs using LocalStack as a stand-in
for real AWS S3. Inside Docker's network, containers reach LocalStack
using the hostname `localstack`. But the actual file upload happens in
**your browser**, which is outside that Docker network and can't
resolve `localstack` — unless your machine's hosts file tells it to.

The hosts entry makes `localstack` resolve to `127.0.0.1` everywhere,
so the same URL works both inside containers and in your browser.
This one line is the only manual system change required.

## Stopping everything

```bash
docker compose down          # stops containers, keeps data
docker compose down -v       # stops containers AND deletes all data
```

## What's Deliberately Not Here

- Terraform, Kubernetes manifests, CI/CD pipelines — these are a
  separate DevOps layer built on top of this application code
- Real AWS credentials or a real Stripe/SES/SNS integration — this repo
  uses LocalStack and mocked notifications for local development only
- Production secrets of any kind — `.env` is gitignored, never commit it

## Tech Stack

| Layer | Tech |
|---|---|
| Backend | Node.js, Express |
| Databases | PostgreSQL (+ PostGIS for geo queries) |
| Messaging | AWS SQS (LocalStack locally) |
| File storage | AWS S3 (LocalStack locally) |
| Frontend | React, Vite, Leaflet, React Router |
| Auth | JWT (jsonwebtoken + bcrypt) |
