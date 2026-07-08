const express = require('express');
const mediaRoutes = require('./routes/media.routes');

const app = express();
const PORT = process.env.PORT || 3002;

app.use(express.json());
app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));
app.use('/media', mediaRoutes);
app.use((req, res) => res.status(404).json({ error: 'Not found.' }));
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ error: 'Internal server error.' });
});

app.listen(PORT, () => console.log(`Media Service running on port ${PORT}`));
module.exports = app;
