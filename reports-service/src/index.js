const express = require('express');
const reportRoutes = require('./routes/report.routes');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));
app.use('/reports', reportRoutes);
app.use((req, res) => res.status(404).json({ error: 'Not found.' }));
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ error: 'Internal server error.' });
});

app.listen(PORT, () => console.log(`Reports Service running on port ${PORT}`));
module.exports = app;
