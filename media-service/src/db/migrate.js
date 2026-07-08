const pool = require('./pool');

async function migrate() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS media (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id     UUID NOT NULL,
        report_id   UUID,                     -- linked to a report (optional at upload time)
        s3_key      TEXT NOT NULL UNIQUE,     -- the file's path inside the S3 bucket
        url         TEXT NOT NULL,            -- full public/CDN URL after upload confirms
        mime_type   TEXT,
        status      TEXT DEFAULT 'pending',   -- 'pending' | 'confirmed'
        created_at  TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('Migration complete: media table ready.');
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
