const express = require('express');
const authenticate = require('./middleware/authenticate');
const proxyRoutes = require('./routes/proxy.routes');

const app = express();
const PORT = process.env.PORT || 3004;

// These two lines are critical — without them the gateway can't
// read the request body to forward it to upstream services
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));

app.use(authenticate);
app.use('/', proxyRoutes);

app.use((req, res) => res.status(404).json({ error: 'Route not found.' }));
app.use((err, req, res, next) => {
  console.error('Gateway error:', err.message);
  res.status(502).json({ error: 'Bad gateway.' });
});

app.listen(PORT, () => console.log(`Gateway running on port ${PORT}`));
module.exports = app;