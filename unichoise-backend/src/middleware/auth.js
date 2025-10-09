/**
 * Middleware для аутентификации и авторизации
 * 
 * Содержит функции middleware для проверки JWT токенов и контроля доступа
 * к различным частям API в зависимости от роли пользователя.
 * 
 * Функции:
 * - authenticateToken: проверяет валидность JWT токена
 * - isAdmin: разрешает доступ только администраторам
 * - isRepresentative: разрешает доступ только представителям вузов
 */

const jwt = require('jsonwebtoken');  // Библиотека для работы с JWT токенами
const env = require('../config/env'); // Импортируем секретный ключ

/**
 * Middleware для аутентификации пользователей
 * Проверяет наличие и валидность JWT токена в заголовке Authorization
 * 
 * @param {Object} req - объект запроса
 * @param {Object} res - объект ответа  
 * @param {Function} next - функция для перехода к следующему middleware
 */
function authenticateToken(req, res, next) {
  try {
    // Извлекаем токен из заголовка Authorization: "Bearer <token>"
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'Токен отсутствует' });
    }
    
    // Проверяем и декодируем токен
    const decoded = jwt.verify(token, env.JWT_SECRET);
    req.user = decoded; // Сохраняем данные пользователя в объект запроса
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Неверный токен' });
  }
}

/**
 * Middleware для проверки прав администратора
 * Разрешает доступ только пользователям с ролью 'admin'
 * 
 * @param {Object} req - объект запроса
 * @param {Object} res - объект ответа
 * @param {Function} next - функция для перехода к следующему middleware
 */
function isAdmin(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(403).json({ message: 'Токен отсутствует' });
  }
  
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    
    // Проверяем роль пользователя
    if (decoded.user_type === 'admin') {
      req.user = decoded;
      return next();
    }
    
    return res.status(403).json({ message: 'Доступ запрещен' });
  } catch {
    return res.status(403).json({ message: 'Неверный токен' });
  }
}

/**
 * Middleware для проверки прав представителя вуза
 * Разрешает доступ только пользователям с ролью 'university_representative'
 * 
 * @param {Object} req - объект запроса
 * @param {Object} res - объект ответа
 * @param {Function} next - функция для перехода к следующему middleware
 */
function isRepresentative(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) return res.status(403).json({ message: 'Токен отсутствует' });
  
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    
    // Проверяем роль пользователя
    if (decoded.user_type === 'university_representative') {
      req.user = decoded;
      return next();
    }
    
    return res.status(403).json({ message: 'Доступ запрещён' });
  } catch {
    return res.status(403).json({ message: 'Неверный токен' });
  }
}

// Экспортируем все middleware функции
module.exports = { authenticateToken, isAdmin, isRepresentative };


