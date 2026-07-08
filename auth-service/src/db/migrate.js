const pool = require('./pool');

// Run this once to create the users table.
// In production, your CI/CD or init container will call: node src/db/migrate.js
async function migrate() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email       TEXT UNIQUE NOT NULL,
        password    TEXT NOT NULL,          -- bcrypt hash, never plain text
        username    TEXT UNIQUE NOT NULL,
        created_at  TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('Migration complete: users table ready.');
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
