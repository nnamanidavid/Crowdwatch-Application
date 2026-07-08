const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const UserModel = require('../models/user.model');

// JWT_SECRET comes from the environment (Kubernetes Secret).
// Never hardcode this — if it leaks, anyone can forge valid tokens.
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = '7d';

function signToken(userId) {
  // The token payload carries the user's id.
  // Other services verify this token to know who made a request.
  return jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

const AuthController = {
  async signup(req, res) {
    const { email, password, username } = req.body;

    if (!email || !password || !username) {
      return res.status(400).json({ error: 'email, password, and username are required.' });
    }

    try {
      const existing = await UserModel.findByEmail(email);
      if (existing) {
        return res.status(409).json({ error: 'Email already registered.' });
      }

      // Hash the password before storing — never store plain text.
      // 12 rounds is a good balance between security and speed.
      const hashedPassword = await bcrypt.hash(password, 12);
      const user = await UserModel.create({ email, password: hashedPassword, username });

      const token = signToken(user.id);
      return res.status(201).json({ token, user });
    } catch (err) {
      console.error('signup error:', err.message);
      return res.status(500).json({ error: 'Internal server error.' });
    }
  },

  async login(req, res) {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required.' });
    }

    try {
      const user = await UserModel.findByEmail(email);
      if (!user) {
        // Return the same message whether the email or password is wrong —
        // never reveal which one failed (prevents user enumeration attacks).
        return res.status(401).json({ error: 'Invalid credentials.' });
      }

      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        return res.status(401).json({ error: 'Invalid credentials.' });
      }

      const token = signToken(user.id);
      const { password: _, ...safeUser } = user; // strip the hash before sending
      return res.status(200).json({ token, user: safeUser });
    } catch (err) {
      console.error('login error:', err.message);
      return res.status(500).json({ error: 'Internal server error.' });
    }
  },

  // Called by other services (via the Gateway) to verify a token is valid.
  async verify(req, res) {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or malformed Authorization header.' });
    }

    const token = authHeader.split(' ')[1];
    try {
      const payload = jwt.verify(token, JWT_SECRET);
      const user = await UserModel.findById(payload.sub);
      if (!user) {
        return res.status(401).json({ error: 'User not found.' });
      }
      return res.status(200).json({ valid: true, user });
    } catch (err) {
      // jwt.verify throws if the token is expired or tampered with
      return res.status(401).json({ error: 'Invalid or expired token.' });
    }
  },
};

module.exports = AuthController;
