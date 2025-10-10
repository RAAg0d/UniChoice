// Маршруты для аутентификации и авторизации пользователей
const express = require('express');
const bcrypt = require('bcrypt'); // Для хеширования паролей
const jwt = require('jsonwebtoken'); // Для создания JWT токенов
const pool = require('../db/pool'); // Подключение к базе данных
const env = require('../config/env'); // Конфигурация окружения
const { authenticateToken } = require('../middleware/auth'); // Middleware для проверки токенов

const router = express.Router();

// POST /login - Вход пользователя в систему
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Поиск пользователя по email
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) return res.status(401).json({ message: 'Неверный email или пароль' });
    
    const user = result.rows[0];
    
    // Проверка пароля с помощью bcrypt
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: 'Неверный email или пароль' });
    
    // Создание JWT токена с данными пользователя
    const token = jwt.sign({
      users_id: user.users_id,
      email: user.email,
      full_name: user.full_name,
      user_type: user.user_type,
    }, env.JWT_SECRET, { expiresIn: '24h' });
    
    // Возврат токена и данных пользователя
    res.json({ token, users_id: user.users_id, email: user.email, full_name: user.full_name, user_type: user.user_type });
  } catch (e) {
    res.status(500).json({ message: 'Ошибка сервера при авторизации' });
  }
});

// POST /register - Регистрация нового пользователя
router.post('/register', async (req, res) => {
  try {
    const { email, password, full_name, is_representative, exam_score } = req.body;
    
    // Валидация обязательных полей
    if (!email || !password || !full_name) return res.status(400).json({ message: 'Все поля обязательны для заполнения' });
    
    // Валидация длины пароля
    if (password.length < 6) return res.status(400).json({ message: 'Пароль должен содержать минимум 6 символов' });
    
    // Валидация формата email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return res.status(400).json({ message: 'Некорректный формат email' });
    
    // Проверка на существование пользователя с таким email
    const exists = await pool.query('SELECT 1 FROM users WHERE email = $1', [email]);
    if (exists.rows.length > 0) return res.status(400).json({ message: 'Пользователь с таким email уже существует' });
    
    // Хеширование пароля
    const hashed = await bcrypt.hash(password, 10);
    
    // Валидация и обработка балла ЕГЭ
    let sanitizedExamScore = null;
    if (exam_score !== undefined && exam_score !== null && exam_score !== '') {
      const parsed = parseInt(exam_score, 10);
      if (Number.isNaN(parsed) || parsed < 0) return res.status(400).json({ message: 'Некорректный балл ЕГЭ' });
      sanitizedExamScore = parsed;
    }
    
    // Создание пользователя в базе данных
    const ins = await pool.query(
      `INSERT INTO users (email, password, full_name, user_type, exam_score) VALUES ($1,$2,$3,$4,$5)
       RETURNING users_id,email,full_name,user_type,exam_score`,
      [email, hashed, full_name, is_representative ? 'university_representative' : 'user', sanitizedExamScore]
    );
    
    const user = ins.rows[0];
    
    // Создание JWT токена для автоматического входа после регистрации
    const token = jwt.sign({ users_id: user.users_id, email: user.email, full_name: user.full_name, user_type: user.user_type }, env.JWT_SECRET, { expiresIn: '24h' });
    
    // Возврат токена и данных пользователя
    res.status(201).json({ token, users_id: user.users_id, email: user.email, full_name: user.full_name, user_type: user.user_type, exam_score: user.exam_score ?? null });
  } catch (e) {
    res.status(500).json({ message: 'Ошибка сервера при регистрации' });
  }
});

// POST /logout - Выход пользователя из системы
router.post('/logout', authenticateToken, async (req, res) => {
  return res.json({ message: 'Успешный выход из системы' });
});

// GET /me - Получение информации о текущем пользователе
router.get('/me', authenticateToken, async (req, res) => {
  res.json({
    users_id: req.user.users_id,
    email: req.user.email,
    full_name: req.user.full_name,
    user_type: req.user.user_type,
  });
});

module.exports = router;


