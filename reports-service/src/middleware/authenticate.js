const jwt = require('jsonwebtoken');

// Each service verifies JWTs independently using the shared JWT_SECRET.
// They don't call Auth Service for every request — that would be slow
// and would make Auth Service a single point of failure.
function authenticate(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization header missing.' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

module.exports = authenticate;
