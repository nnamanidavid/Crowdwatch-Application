const pool = require('../db/pool');

const ReportModel = {
  async create({ userId, title, description, category, lat, lng }) {
    // ST_MakePoint builds a PostGIS point from lng, lat (note: longitude first).
    // ::geography casts it to the geography type so distance functions work.
    const { rows } = await pool.query(
      `INSERT INTO reports (user_id, title, description, category, location)
       VALUES ($1, $2, $3, $4, ST_MakePoint($5, $6)::geography)
       RETURNING id, user_id, title, description, category, status,
                 ST_Y(location::geometry) AS lat,
                 ST_X(location::geometry) AS lng,
                 media_urls, created_at`,
      [userId, title, description, category, lng, lat]
    );
    return rows[0];
  },

  async findById(id) {
    const { rows } = await pool.query(
      `SELECT id, user_id, title, description, category, status,
              ST_Y(location::geometry) AS lat,
              ST_X(location::geometry) AS lng,
              media_urls, created_at, updated_at
       FROM reports WHERE id = $1`,
      [id]
    );
    return rows[0] || null;
  },

  // The core geo query: find all reports within `radiusKm` of a lat/lng point.
  // ST_DWithin checks if two geography objects are within a given distance (in metres).
  async findWithinRadius({ lat, lng, radiusKm = 5 }) {
    const radiusMetres = radiusKm * 1000;
    const { rows } = await pool.query(
      `SELECT id, user_id, title, description, category, status,
              ST_Y(location::geometry) AS lat,
              ST_X(location::geometry) AS lng,
              media_urls, created_at,
              ST_Distance(location, ST_MakePoint($1, $2)::geography) AS distance_m
       FROM reports
       WHERE ST_DWithin(location, ST_MakePoint($1, $2)::geography, $3)
         AND status = 'active'
       ORDER BY distance_m ASC`,
      [lng, lat, radiusMetres]
    );
    return rows;
  },

  async addMediaUrl(id, mediaUrl) {
    const { rows } = await pool.query(
      `UPDATE reports
       SET media_urls = array_append(media_urls, $1), updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [mediaUrl, id]
    );
    return rows[0] || null;
  },

  async resolve(id, userId) {
    // Only the report's creator can resolve it.
    const { rows } = await pool.query(
      `UPDATE reports SET status = 'resolved', updated_at = NOW()
       WHERE id = $1 AND user_id = $2
       RETURNING id, status`,
      [id, userId]
    );
    return rows[0] || null;
  },

  // Find subscribers who should be notified about a new report at lat/lng.
  async findNearbySubscribers({ lat, lng }) {
    const { rows } = await pool.query(
      `SELECT user_id, radius_km
       FROM location_subscriptions
       WHERE ST_DWithin(
         location,
         ST_MakePoint($1, $2)::geography,
         radius_km * 1000
       )`,
      [lng, lat]
    );
    return rows;
  },

  async subscribe({ userId, lat, lng, radiusKm = 5 }) {
    const { rows } = await pool.query(
      `INSERT INTO location_subscriptions (user_id, location, radius_km)
       VALUES ($1, ST_MakePoint($2, $3)::geography, $4)
       ON CONFLICT DO NOTHING
       RETURNING id, user_id, radius_km`,
      [userId, lng, lat, radiusKm]
    );
    return rows[0];
  },
};

module.exports = ReportModel;
