const jwt = require('jsonwebtoken');

// This middleware protects any route that requires a logged-in user.
// Attach it to a route like: router.get('/me', authenticate, handler)
// It reads the token from the Authorization header, verifies it,
// and puts the decoded payload on req.user so the next handler can use it.

function authenticate(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization header missing or malformed.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload; // { sub: userId, iat: ..., exp: ... }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

module.exports = authenticate;
