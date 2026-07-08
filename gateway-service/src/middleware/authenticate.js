const jwt = require('jsonwebtoken');

// The Gateway is the only service exposed to the internet via the ALB.
// It verifies the JWT here so downstream services don't have to worry
// about unauthenticated requests reaching them at all.
// Think of it as the security guard at the building entrance.

function authenticate(req, res, next) {
  // Some routes (login, signup) are public — skip them
  const PUBLIC_PATHS = ['/auth/signup', '/auth/login', '/health'];
  if (PUBLIC_PATHS.includes(req.path)) return next();

  const authHeader = req.headers['authorization'];
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization header missing.' });
  }

  try {
    const payload = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
    // Attach user info as a header so downstream services can read it
    // without re-verifying the token themselves (they still can if they want).
    req.headers['x-user-id'] = payload.sub;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token.' });
  }
}

module.exports = authenticate;
