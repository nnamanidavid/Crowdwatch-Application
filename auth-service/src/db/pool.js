const { Pool } = require('pg');

// pg reads DATABASE_URL from the environment automatically.
// Kubernetes will inject this via a Secret — we just read it.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

pool.on('error', (err) => {
  console.error('Unexpected Postgres client error:', err.message);
  process.exit(1);
});

module.exports = pool;
