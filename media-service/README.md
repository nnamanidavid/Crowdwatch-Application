# Media Service

Handles file uploads for incident reports using a two-step S3 presigned URL flow.
Files never pass through this server — the frontend uploads directly to S3.

## Environment Variables

| Variable          | Description                              |
|-------------------|------------------------------------------|
| `DATABASE_URL`    | Postgres connection string               |
| `JWT_SECRET`      | Shared secret to verify JWTs locally     |
| `S3_BUCKET_NAME`  | Name of the S3 bucket for media storage  |
| `AWS_REGION`      | AWS region (default: us-east-1)          |
| `PORT`            | Port to listen on (default: 3002)        |
| `DATABASE_SSL`    | Set to `true` on RDS (default: false)    |

## Routes

| Method | Path                      | Auth | Description                                 |
|--------|---------------------------|------|---------------------------------------------|
| POST   | /media/presign            | Yes  | Get a signed S3 upload URL (valid 5 min)    |
| POST   | /media/confirm            | Yes  | Confirm upload complete, marks as confirmed |
| GET    | /media/report/:reportId   | Yes  | Get confirmed media for a report            |
| GET    | /health                   | No   | Kubernetes liveness probe                   |

## Upload Flow

1. `POST /media/presign` → returns `{ upload_url, s3_key, media_id }`
2. Frontend `PUT`s file directly to `upload_url` (goes to S3, not this server)
3. `POST /media/confirm` with `{ s3_key }` → marks the media record as confirmed

## Setup

```bash
npm install
node src/db/migrate.js   # creates the media table
npm start
```

## IAM Requirement

The pod's IAM role (via IRSA) must have `s3:PutObject` on the media bucket.
