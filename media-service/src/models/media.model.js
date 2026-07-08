const pool = require('../db/pool');

const MediaModel = {
  async create({ userId, reportId, s3Key, url, mimeType }) {
    const { rows } = await pool.query(
      `INSERT INTO media (user_id, report_id, s3_key, url, mime_type)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [userId, reportId || null, s3Key, url, mimeType || null]
    );
    return rows[0];
  },

  async confirm(s3Key) {
    // Called after the frontend tells us the S3 upload finished.
    const { rows } = await pool.query(
      `UPDATE media SET status = 'confirmed'
       WHERE s3_key = $1
       RETURNING *`,
      [s3Key]
    );
    return rows[0] || null;
  },

  async findByReportId(reportId) {
    const { rows } = await pool.query(
      `SELECT * FROM media WHERE report_id = $1 AND status = 'confirmed'`,
      [reportId]
    );
    return rows;
  },
};

module.exports = MediaModel;
