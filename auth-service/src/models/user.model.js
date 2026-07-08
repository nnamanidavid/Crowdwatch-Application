const pool = require('../db/pool');

// All SQL for the users table lives here.
// Controllers call these functions — they never write SQL themselves.

const UserModel = {
  async findByEmail(email) {
    const { rows } = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return rows[0] || null;
  },

  async findById(id) {
    const { rows } = await pool.query(
      'SELECT id, email, username, created_at FROM users WHERE id = $1',
      [id]
    );
    return rows[0] || null;
  },

  async create({ email, password, username }) {
    const { rows } = await pool.query(
      `INSERT INTO users (email, password, username)
       VALUES ($1, $2, $3)
       RETURNING id, email, username, created_at`,
      [email, password, username]
    );
    return rows[0];
  },
};

module.exports = UserModel;
