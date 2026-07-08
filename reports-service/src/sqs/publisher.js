const { SQSClient, SendMessageCommand } = require('@aws-sdk/client-sqs');
const ReportModel = require('../models/report.model');

// AWS_ENDPOINT_URL is only set in local docker-compose (pointing at LocalStack).
// In production/EKS this env var is absent, so the SDK talks to real AWS
// and picks up credentials from the pod's IAM role automatically.
const sqsConfig = { region: process.env.AWS_REGION || 'us-east-1' };
if (process.env.AWS_ENDPOINT_URL) {
  sqsConfig.endpoint = process.env.AWS_ENDPOINT_URL;
  sqsConfig.credentials = { accessKeyId: 'test', secretAccessKey: 'test' }; // LocalStack ignores real creds
}
const sqs = new SQSClient(sqsConfig);

async function publishNewReport(report) {
  // Reports Service owns the location_subscriptions table, so it finds
  // nearby subscribers HERE before publishing — not in Notification Service.
  // This way Notification Service never needs to touch another service's DB.
  const subscribers = await ReportModel.findNearbySubscribers({
    lat: report.lat,
    lng: report.lng,
  });

  const command = new SendMessageCommand({
    QueueUrl: process.env.REPORTS_QUEUE_URL,
    MessageBody: JSON.stringify({
      event: 'new_report_created',
      report: {
        id: report.id,
        title: report.title,
        category: report.category,
        lat: report.lat,
        lng: report.lng,
        created_at: report.created_at,
      },
      // Subscriber list is baked into the event — Notification Service
      // just reads this and sends alerts, no DB call required.
      subscriber_ids: subscribers.map(s => s.user_id),
    }),
  });

  const result = await sqs.send(command);
  console.log(`SQS published for report ${report.id}. ${subscribers.length} subscribers. MessageId: ${result.MessageId}`);
  return result;
}

module.exports = { publishNewReport };
