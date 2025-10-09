const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db/pool');
const env = require('../config/env');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// POST /login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) return res.status(401).json({ message: 'Неверный email или пароль' });
    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: 'Неверный email или пароль' });
    const token = jwt.sign({
      users_id: user.users_id,
      email: user.email,
      full_name: user.full_name,
      user_type: user.user_type,
    }, env.JWT_SECRET, { expiresIn: '24h' });
    res.json({ token, users_id: user.users_id, email: user.email, full_name: user.full_name, user_type: user.user_type });
  } catch (e) {
    res.status(500).json({ message: 'Ошибка сервера при авторизации' });
  }
});

// POST /register
router.post('/register', async (req, res) => {
  try {
    const { email, password, full_name, is_representative, exam_score } = req.body;
    if (!email || !password || !full_name) return res.status(400).json({ message: 'Все поля обязательны для заполнения' });
    if (password.length < 6) return res.status(400).json({ message: 'Пароль должен содержать минимум 6 символов' });
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return res.status(400).json({ message: 'Некорректный формат email' });
    const exists = await pool.query('SELECT 1 FROM users WHERE email = $1', [email]);
    if (exists.rows.length > 0) return res.status(400).json({ message: 'Пользователь с таким email уже существует' });
    const hashed = await bcrypt.hash(password, 10);
    let sanitizedExamScore = null;
    if (exam_score !== undefined && exam_score !== null && exam_score !== '') {
      const parsed = parseInt(exam_score, 10);
      if (Number.isNaN(parsed) || parsed < 0) return res.status(400).json({ message: 'Некорректный балл ЕГЭ' });
      sanitizedExamScore = parsed;
    }
    const ins = await pool.query(
      `INSERT INTO users (email, password, full_name, user_type, exam_score) VALUES ($1,$2,$3,$4,$5)
       RETURNING users_id,email,full_name,user_type,exam_score`,
      [email, hashed, full_name, is_representative ? 'university_representative' : 'user', sanitizedExamScore]
    );
    const user = ins.rows[0];
    const token = jwt.sign({ users_id: user.users_id, email: user.email, full_name: user.full_name, user_type: user.user_type }, env.JWT_SECRET, { expiresIn: '24h' });
    res.status(201).json({ token, users_id: user.users_id, email: user.email, full_name: user.full_name, user_type: user.user_type, exam_score: user.exam_score ?? null });
  } catch (e) {
    res.status(500).json({ message: 'Ошибка сервера при регистрации' });
  }
});

// POST /logout
router.post('/logout', authenticateToken, async (req, res) => {
  return res.json({ message: 'Успешный выход из системы' });
});

// GET /me
router.get('/me', authenticateToken, async (req, res) => {
  res.json({
    users_id: req.user.users_id,
    email: req.user.email,
    full_name: req.user.full_name,
    user_type: req.user.user_type,
  });
});

module.exports = router;


