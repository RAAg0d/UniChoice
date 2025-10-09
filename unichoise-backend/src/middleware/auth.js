const jwt = require('jsonwebtoken');
const env = require('../config/env');

// Authenticate requests using Bearer JWT
function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'Токен отсутствует' });
    }
    const decoded = jwt.verify(token, env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Неверный токен' });
  }
}

// Admin-only access
function isAdmin(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(403).json({ message: 'Токен отсутствует' });
  }
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    if (decoded.user_type === 'admin') {
      req.user = decoded;
      return next();
    }
    return res.status(403).json({ message: 'Доступ запрещен' });
  } catch {
    return res.status(403).json({ message: 'Неверный токен' });
  }
}

// University representative-only access
function isRepresentative(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(403).json({ message: 'Токен отсутствует' });
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    if (decoded.user_type === 'university_representative') {
      req.user = decoded;
      return next();
    }
    return res.status(403).json({ message: 'Доступ запрещён' });
  } catch {
    return res.status(403).json({ message: 'Неверный токен' });
  }
}

module.exports = { authenticateToken, isAdmin, isRepresentative };


