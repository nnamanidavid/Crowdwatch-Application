# Reports Service

Handles incident report CRUD and geo radius search using PostGIS.
Also owns the `location_subscriptions` table and publishes
`new_report_created` events to SQS when a report is created.

## Environment Variables

| Variable           | Description                                  |
|--------------------|----------------------------------------------|
| `DATABASE_URL`     | Postgres + PostGIS connection string         |
| `JWT_SECRET`       | Shared secret to verify JWTs locally         |
| `REPORTS_QUEUE_URL`| Full SQS queue URL for publishing events     |
| `AWS_REGION`       | AWS region (default: us-east-1)              |
| `PORT`             | Port to listen on (default: 3001)            |
| `DATABASE_SSL`     | Set to `true` on RDS (default: false)        |

## Routes

| Method | Path                      | Auth | Description                              |
|--------|---------------------------|------|------------------------------------------|
| POST   | /reports                  | Yes  | Create a new report, publishes SQS event |
| GET    | /reports/nearby           | Yes  | Get reports within radius (?lat=&lng=&radius=) |
| GET    | /reports/:id              | Yes  | Get a single report by ID                |
| PATCH  | /reports/:id/resolve      | Yes  | Mark a report resolved (owner only)      |
| POST   | /reports/subscriptions    | Yes  | Subscribe to alerts in an area           |
| GET    | /health                   | No   | Kubernetes liveness probe                |

## Database Notes

Requires PostGIS extension enabled on your Postgres instance.
Run `CREATE EXTENSION IF NOT EXISTS postgis;` once, or let the migration handle it.

## Setup

```bash
npm install
node src/db/migrate.js   # enables PostGIS, creates reports + subscriptions tables
npm start
```

## SQS Event Published

```json
{
  "event": "new_report_created",
  "report": { "id": "...", "title": "...", "category": "...", "lat": 6.5, "lng": 3.3 },
  "subscriber_ids": ["uuid1", "uuid2"]
}
```
