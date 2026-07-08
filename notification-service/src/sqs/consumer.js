const { SQSClient, ReceiveMessageCommand, DeleteMessageCommand } = require('@aws-sdk/client-sqs');
const pool = require('../db/pool');

const sqsConfig = { region: process.env.AWS_REGION || 'us-east-1' };
if (process.env.AWS_ENDPOINT_URL) {
  sqsConfig.endpoint = process.env.AWS_ENDPOINT_URL;
  sqsConfig.credentials = { accessKeyId: 'test', secretAccessKey: 'test' };
}
const sqs = new SQSClient(sqsConfig);
const QUEUE_URL = process.env.REPORTS_QUEUE_URL;

async function processMessage(message) {
  let body;
  try {
    body = JSON.parse(message.Body);
  } catch {
    console.error('Failed to parse SQS message — skipping.');
    return;
  }

  if (body.event !== 'new_report_created') {
    console.log(`Unknown event type: ${body.event} — skipping.`);
    return;
  }

  const { report, subscriber_ids } = body;

  // subscriber_ids was built by Reports Service before publishing.
  // Notification Service never touches Reports Service's DB directly —
  // that would break the "each service owns its own data" rule.
  if (!subscriber_ids || subscriber_ids.length === 0) {
    console.log(`No subscribers for report ${report.id}.`);
    return;
  }

  console.log(`Notifying ${subscriber_ids.length} subscriber(s) for report ${report.id}`);

  for (const userId of subscriber_ids) {
    const message_text = `New ${report.category} reported near you: "${report.title}"`;

    // MOCK: swap this console.log for SES/SNS/push when infra is ready.
    console.log(`[MOCK ALERT] → user ${userId}: ${message_text}`);

    try {
      await pool.query(
        `INSERT INTO notifications (user_id, report_id, message)
         VALUES ($1, $2, $3)`,
        [userId, report.id, message_text]
      );
    } catch (err) {
      console.error(`Failed to log notification for user ${userId}:`, err.message);
    }
  }
}

async function poll() {
  console.log('Notification Service polling SQS...');
  while (true) {
    try {
      const { Messages } = await sqs.send(new ReceiveMessageCommand({
        QueueUrl: QUEUE_URL,
        MaxNumberOfMessages: 10,
        WaitTimeSeconds: 20,
      }));

      if (!Messages || Messages.length === 0) continue;

      for (const msg of Messages) {
        await processMessage(msg);
        await sqs.send(new DeleteMessageCommand({
          QueueUrl: QUEUE_URL,
          ReceiptHandle: msg.ReceiptHandle,
        }));
      }
    } catch (err) {
      console.error('SQS poll error:', err.message);
      await new Promise(r => setTimeout(r, 5000));
    }
  }
}

module.exports = { poll };
