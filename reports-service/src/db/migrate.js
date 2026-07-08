const pool = require('./pool');

// PostGIS is a Postgres extension that adds geographic data types.
// The GEOGRAPHY(POINT, 4326) column type stores lat/long coordinates
// in a format that lets Postgres do distance calculations natively.
// 4326 is the standard coordinate system used by GPS (WGS84).
async function migrate() {
  const client = await pool.connect();
  try {
    // Enable PostGIS — only needs to happen once per database.
    // Your RDS instance must have PostGIS available (use a PostGIS-enabled
    // parameter group or enable it via an init script).
    await client.query(`CREATE EXTENSION IF NOT EXISTS postgis;`);

    await client.query(`
      CREATE TABLE IF NOT EXISTS reports (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id     UUID NOT NULL,
        title       TEXT NOT NULL,
        description TEXT,
        category    TEXT NOT NULL,        -- e.g. 'fire', 'flood', 'accident'
        status      TEXT DEFAULT 'active', -- 'active' | 'resolved'
        location    GEOGRAPHY(POINT, 4326) NOT NULL, -- stores lat/lng
        media_urls  TEXT[] DEFAULT '{}',  -- array of S3 URLs attached to report
        created_at  TIMESTAMPTZ DEFAULT NOW(),
        updated_at  TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // Index on location so geo queries run fast instead of scanning every row.
    await client.query(`
      CREATE INDEX IF NOT EXISTS reports_location_idx
      ON reports USING GIST (location);
    `);

    // Subscriptions table: stores which user is watching which area.
    // When a new report comes in, we query this to find who to notify.
    await client.query(`
      CREATE TABLE IF NOT EXISTS location_subscriptions (
        id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id     UUID NOT NULL,
        location    GEOGRAPHY(POINT, 4326) NOT NULL,
        radius_km   NUMERIC NOT NULL DEFAULT 5,  -- notify when reports within this radius
        created_at  TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS subscriptions_location_idx
      ON location_subscriptions USING GIST (location);
    `);

    console.log('Migration complete: reports and location_subscriptions tables ready.');
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
