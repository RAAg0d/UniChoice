/**
 * Роутер для аутентификации пользователей
 * 
 * Обрабатывает все запросы связанные с авторизацией:
 * - POST /login - вход в систему
 * - POST /register - регистрация нового пользователя
 * - POST /logout - выход из системы
 * - GET /me - получение информации о текущем пользователе
 * 
 * Использует JWT токены для аутентификации и bcrypt для хеширования паролей.
 */

const express = require('express');     // Express framework
const bcrypt = require('bcrypt');       // Хеширование паролей
const jwt = require('jsonwebtoken');    // JWT токены
const pool = require('../db/pool');     // Пул соединений с БД
const env = require('../config/env');   // Конфигурация
const { authenticateToken } = require('../middleware/auth'); // Middleware аутентификации

const router = express.Router();

/**
 * POST /login - Вход в систему
 * 
 * Проверяет email и пароль пользователя, возвращает JWT токен при успешной авторизации.
 * 
 * @param {string} email - email пользователя
 * @param {string} password - пароль пользователя
 * @returns {Object} JWT токен и данные пользователя
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Ищем пользователя по email
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Неверный email или пароль' });
    }
    
    const user = result.rows[0];
    
    // Проверяем пароль с помощью bcrypt
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ message: 'Неверный email или пароль' });
    }
    
    // Создаем JWT токен с данными пользователя
    const token = jwt.sign({
      users_id: user.users_id,
      email: user.email,
      full_name: user.full_name,
      user_type: user.user_type,
    }, env.JWT_SECRET, { expiresIn: '24h' });
    
    // Возвращаем токен и данные пользователя
    res.json({ 
      token, 
      users_id: user.users_id, 
      email: user.email, 
      full_name: user.full_name, 
      user_type: user.user_type 
    });
  } catch (e) {
    res.status(500).json({ message: 'Ошибка сервера при авторизации' });
  }
});

/**
 * POST /register - Регистрация нового пользователя
 * 
 * Создает нового пользователя в системе с валидацией данных.
 * Поддерживает регистрацию обычных пользователей и представителей вузов.
 * 
 * @param {string} email - email пользователя
 * @param {string} password - пароль (минимум 6 символов)
 * @param {string} full_name - полное имя пользователя
 * @param {boolean} is_representative - является ли представителем вуза
 * @param {number} exam_score - баллы ЕГЭ (опционально)
 * @returns {Object} JWT токен и данные пользователя
 */
router.post('/register', async (req, res) => {
  try {
    const { email, password, full_name, is_representative, exam_score } = req.body;
    
    // Валидация обязательных полей
    if (!email || !password || !full_name) {
      return res.status(400).json({ message: 'Все поля обязательны для заполнения' });
    }
    
    // Валидация длины пароля
    if (password.length < 6) {
      return res.status(400).json({ message: 'Пароль должен содержать минимум 6 символов' });
    }
    
    // Валидация формата email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ message: 'Некорректный формат email' });
    }
    
    // Проверка уникальности email
    const exists = await pool.query('SELECT 1 FROM users WHERE email = $1', [email]);
    if (exists.rows.length > 0) {
      return res.status(400).json({ message: 'Пользователь с таким email уже существует' });
    }
    
    // Хеширование пароля
    const hashed = await bcrypt.hash(password, 10);
    
    // Валидация и санитизация баллов ЕГЭ
    let sanitizedExamScore = null;
    if (exam_score !== undefined && exam_score !== null && exam_score !== '') {
      const parsed = parseInt(exam_score, 10);
      if (Number.isNaN(parsed) || parsed < 0) {
        return res.status(400).json({ message: 'Некорректный балл ЕГЭ' });
      }
      sanitizedExamScore = parsed;
    }
    
    // Создание пользователя в БД
    const ins = await pool.query(
      `INSERT INTO users (email, password, full_name, user_type, exam_score) VALUES ($1,$2,$3,$4,$5)
       RETURNING users_id,email,full_name,user_type,exam_score`,
      [email, hashed, full_name, is_representative ? 'university_representative' : 'user', sanitizedExamScore]
    );
    
    const user = ins.rows[0];
    
    // Создание JWT токена
    const token = jwt.sign({ 
      users_id: user.users_id, 
      email: user.email, 
      full_name: user.full_name, 
      user_type: user.user_type 
    }, env.JWT_SECRET, { expiresIn: '24h' });
    
    // Возвращаем токен и данные пользователя
    res.status(201).json({ 
      token, 
      users_id: user.users_id, 
      email: user.email, 
      full_name: user.full_name, 
      user_type: user.user_type, 
      exam_score: user.exam_score ?? null 
    });
  } catch (e) {
    res.status(500).json({ message: 'Ошибка сервера при регистрации' });
  }
});

/**
 * POST /logout - Выход из системы
 * 
 * Простой endpoint для выхода из системы.
 * В реальном приложении здесь можно добавить логику инвалидации токенов.
 * 
 * @requires authenticateToken - требует аутентификации
 * @returns {Object} сообщение об успешном выходе
 */
router.post('/logout', authenticateToken, async (req, res) => {
  return res.json({ message: 'Успешный выход из системы' });
});

/**
 * GET /me - Получение информации о текущем пользователе
 * 
 * Возвращает данные текущего аутентифицированного пользователя.
 * 
 * @requires authenticateToken - требует аутентификации
 * @returns {Object} данные пользователя из JWT токена
 */
router.get('/me', authenticateToken, async (req, res) => {
  res.json({
    users_id: req.user.users_id,
    email: req.user.email,
    full_name: req.user.full_name,
    user_type: req.user.user_type,
  });
});

module.exports = router;


