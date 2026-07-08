const express = require('express');
const { poll } = require('./sqs/consumer');

const app = express();
const PORT = process.env.PORT || 3003;

app.use(express.json());

// Kubernetes needs a /health endpoint to know if this pod is alive.
// The service itself doesn't serve API traffic — it just polls SQS.
app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));

app.listen(PORT, () => {
  console.log(`Notification Service health server on port ${PORT}`);
  // Start the SQS polling loop — this runs forever in the background.
  poll().catch((err) => {
    console.error('Fatal polling error:', err.message);
    process.exit(1);
  });
});

module.exports = app;
