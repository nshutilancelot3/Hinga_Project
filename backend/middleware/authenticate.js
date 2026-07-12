const jwt = require('jsonwebtoken');

function authenticate(req, res, next) {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Missing or invalid token' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      user_id: payload.user_id,
      role: payload.role,
      district: payload.district,
    };
    next();
  } catch {
    return res.status(401).json({ error: 'Missing or invalid token' });
  }
}

module.exports = authenticate;
