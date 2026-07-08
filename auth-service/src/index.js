const express = require('express');
const authRoutes = require('./routes/auth.routes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Health check — Kubernetes liveness/readiness probes hit this.
// It should return 200 quickly with no heavy logic inside.
app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));

// Mount auth routes under /auth
app.use('/auth', authRoutes);

// Catch-all for unknown routes
app.use((req, res) => res.status(404).json({ error: 'Not found.' }));

// Global error handler — catches anything that slips through
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ error: 'Internal server error.' });
});

app.listen(PORT, () => {
  console.log(`Auth Service running on port ${PORT}`);
});

module.exports = app;
