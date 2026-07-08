const pool = require('./pool');

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id     UUID NOT NULL,
        report_id   UUID NOT NULL,
        message     TEXT NOT NULL,
        sent_at     TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('Migration complete: notifications table ready.');
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
