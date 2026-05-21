const jwt = require('jsonwebtoken');
const User = require('../models/User');

/** SSE clients cannot send Authorization headers; accept ?token= JWT */
const protectSSE = async (req, res, next) => {
  const header = req.headers.authorization;
  const queryToken = req.query.token;
  const raw = header?.startsWith('Bearer ') ? header.split(' ')[1] : queryToken;

  if (!raw) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  try {
    const decoded = jwt.verify(raw, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.id);
    if (!req.user) return res.status(401).json({ message: 'User no longer exists' });
    next();
  } catch {
    res.status(401).json({ message: 'Not authorized, token invalid' });
  }
};

module.exports = { protectSSE };
