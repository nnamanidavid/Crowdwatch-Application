const express = require('express');
const authenticate = require('./middleware/authenticate');
const proxyRoutes = require('./routes/proxy.routes');

const app = express();
const PORT = process.env.PORT || 3004;

app.use(express.json());

// Health check — ALB needs this to mark the target as healthy.
app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));

// Auth middleware runs on every request before proxying.
// Public routes (/auth/signup, /auth/login) are whitelisted inside the middleware.
app.use(authenticate);

// Route to upstream services
app.use('/', proxyRoutes);

app.use((req, res) => res.status(404).json({ error: 'Route not found.' }));
app.use((err, req, res, next) => {
  console.error('Gateway error:', err.message);
  res.status(502).json({ error: 'Bad gateway.' });
});

app.listen(PORT, () => console.log(`Gateway running on port ${PORT}`));
module.exports = app;
