# Notification Service

Consumes `new_report_created` events from SQS and sends alerts to nearby users.
This service has NO HTTP API — it runs a polling loop only.
The only HTTP endpoint is `/health` for Kubernetes liveness probes.

## Environment Variables

| Variable            | Description                              |
|---------------------|------------------------------------------|
| `DATABASE_URL`      | Postgres connection string               |
| `REPORTS_QUEUE_URL` | Full SQS queue URL to consume from       |
| `AWS_REGION`        | AWS region (default: us-east-1)          |
| `PORT`              | Health check port (default: 3003)        |
| `DATABASE_SSL`      | Set to `true` on RDS (default: false)    |

## How It Works

1. Polls SQS every 20 seconds (long polling)
2. Reads `new_report_created` event — subscriber IDs are already in the payload
   (Reports Service builds the list before publishing)
3. Logs a mock alert per subscriber and records it in the `notifications` table
4. Deletes the message from SQS after processing

## Replacing the Mock

Search for `[MOCK ALERT]` in `src/sqs/consumer.js` and replace the
`console.log` with your real notification provider (SES for email, SNS for push).

## Setup

```bash
npm install
node src/db/migrate.js   # creates the notifications table
npm start
```

## IAM Requirement

The pod's IAM role (via IRSA) must have `sqs:ReceiveMessage`, `sqs:DeleteMessage`,
and `sqs:GetQueueAttributes` on the reports queue.
