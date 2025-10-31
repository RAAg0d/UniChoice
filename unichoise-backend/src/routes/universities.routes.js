// Маршруты для работы с университетами
const express = require('express');
const universityController = require('../controllers/universityController');
const { isAdmin } = require('../middleware/auth');
const pool = require('../db/pool');
const CONSTANTS = require('../constants');

const router = express.Router();

// GET /universities - список университетов с фильтрацией
router.get('/', universityController.getUniversities.bind(universityController));

// GET /universities/random - случайный университет
router.get('/random', universityController.getRandomUniversity.bind(universityController));

// GET /universities/:id - университет по ID
router.get('/:id', universityController.getUniversityById.bind(universityController));

// POST /universities - создание университета (только для админов)
router.post('/', isAdmin, async (req, res) => {
  try {
    const { name, description, location } = req.body;

    if (!name || !description || !location) {
      return res.status(CONSTANTS.HTTP_STATUS.BAD_REQUEST)
                .json({ message: 'Все поля обязательны для заполнения' });
    }

    const result = await pool.query(
      `INSERT INTO universities (name, description, location) 
       VALUES ($1, $2, $3) 
       RETURNING *`,
      [name, description, location]
    );

    res.status(CONSTANTS.HTTP_STATUS.CREATED).json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка при создании университета:', error);
    res.status(CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR)
       .json({ message: 'Ошибка сервера при создании университета' });
  }
});

// PUT /universities/:id - обновление университета (только для админов)
router.put('/:id', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, location } = req.body;

    if (!name || !description || !location) {
      return res.status(CONSTANTS.HTTP_STATUS.BAD_REQUEST)
                .json({ message: 'Все поля обязательны для заполнения' });
    }

    const result = await pool.query(
      `UPDATE universities 
       SET name = $1, description = $2, location = $3 
       WHERE universities_id = $4 
       RETURNING *`,
      [name, description, location, id]
    );

    if (result.rows.length === 0) {
      return res.status(CONSTANTS.HTTP_STATUS.NOT_FOUND)
                .json({ message: 'Университет не найден' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка при обновлении университета:', error);
    res.status(CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR)
       .json({ message: 'Ошибка сервера при обновлении университета' });
  }
});

// DELETE /universities/:id - удаление университета (только для админов)
router.delete('/:id', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM universities WHERE universities_id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(CONSTANTS.HTTP_STATUS.NOT_FOUND)
                .json({ message: 'Университет не найден' });
    }

    res.json({ message: 'Университет успешно удален' });
  } catch (error) {
    console.error('Ошибка при удалении университета:', error);
    res.status(CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR)
       .json({ message: 'Ошибка сервера при удалении университета' });
  }
});

// GET /universities/:id/reviews - отзывы университета
router.get('/:id/reviews', async (req, res) => {
  const { id } = req.params;

  try {
    const reviews = await pool.query(
      `SELECT reviews.*, users.full_name 
       FROM reviews 
       LEFT JOIN users ON reviews.user_id = users.users_id 
       WHERE university_id = $1 
       ORDER BY created_at DESC`,
      [id]
    );

    res.json(reviews.rows);
  } catch (error) {
    console.error('Ошибка при получении отзывов:', error);
    res.status(CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR)
       .json({ message: error.message });
  }
});

// POST /universities/:id/reviews - добавление отзыва
router.post('/:id/reviews', async (req, res) => {
  const { id } = req.params;
  const { user_id, rating, comment } = req.body;

  // Валидация данных согласно даталогической модели
  if (!user_id || !rating) {
    return res.status(CONSTANTS.HTTP_STATUS.BAD_REQUEST)
              .json({ message: 'ID пользователя и оценка обязательны' });
  }

  // Валидация ID пользователя (1-999)
  const parsedUserId = parseInt(user_id);
  if (isNaN(parsedUserId) || parsedUserId < CONSTANTS.VALIDATION.ID_MIN || parsedUserId > CONSTANTS.VALIDATION.ID_MAX) {
    return res.status(CONSTANTS.HTTP_STATUS.BAD_REQUEST)
              .json({ message: 'ID пользователя должен быть от 1 до 999' });
  }

  // Валидация ID университета (1-999)
  const parsedUniversityId = parseInt(id);
  if (isNaN(parsedUniversityId) || parsedUniversityId < CONSTANTS.VALIDATION.ID_MIN || parsedUniversityId > CONSTANTS.VALIDATION.ID_MAX) {
    return res.status(CONSTANTS.HTTP_STATUS.BAD_REQUEST)
              .json({ message: 'ID университета должен быть от 1 до 999' });
  }

  // Валидация оценки (1-5)
  const parsedRating = parseInt(rating);
  if (isNaN(parsedRating) || parsedRating < CONSTANTS.VALIDATION.RATING_MIN || parsedRating > CONSTANTS.VALIDATION.RATING_MAX) {
    return res.status(CONSTANTS.HTTP_STATUS.BAD_REQUEST)
              .json({ message: 'Оценка должна быть от 1 до 5' });
  }

  // Валидация длины комментария (максимум 150 символов)
  if (comment && comment.length > CONSTANTS.VALIDATION.COMMENT_MAX_LENGTH) {
    return res.status(CONSTANTS.HTTP_STATUS.BAD_REQUEST)
              .json({ message: 'Комментарий не должен превышать 150 символов' });
  }

  try {
    const newReview = await pool.query(
      `INSERT INTO reviews (university_id, user_id, rating, comment) 
       VALUES ($1, $2, $3, $4) 
       RETURNING reviews.*, 
       (SELECT full_name FROM users WHERE users_id = $2) AS full_name`,
      [parsedUniversityId, parsedUserId, parsedRating, comment]
    );

    res.status(CONSTANTS.HTTP_STATUS.CREATED).json(newReview.rows[0]);
  } catch (error) {
    console.error('Ошибка при добавлении отзыва:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      constraint: error.constraint,
      stack: error.stack
    });
    res.status(CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR)
       .json({ message: 'Ошибка сервера при добавлении отзыва', code: error.code, detail: error.detail, constraint: error.constraint });
  }
});

// GET /universities/:id/specialties - специальности университета
router.get('/:id/specialties', async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      SELECT * FROM specialties 
      WHERE universities_id = $1 
      ORDER BY specialty_name
    `;
    
    const { rows } = await pool.query(query, [id]);
    res.json(rows);
  } catch (error) {
    console.error('Ошибка при получении специальностей:', error);
    res.status(CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR)
       .json({ message: 'Ошибка сервера' });
  }
});

// POST /universities/:id/specialties - создание специальности (только для админов)
router.post('/:id/specialties', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      specialty_name, 
      specialty_code, 
      description, 
      duration, 
      form_of_education, 
      budget_places, 
      cost_per_year, 
      passing_score 
    } = req.body;

    if (!specialty_name || !specialty_code) {
      return res.status(CONSTANTS.HTTP_STATUS.BAD_REQUEST)
                .json({ message: 'Название и код специальности обязательны' });
    }

    const result = await pool.query(
      `INSERT INTO specialties (
        universities_id, specialty_name, specialty_code, description, 
        duration, form_of_education, budget_places, cost_per_year, passing_score
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) 
       RETURNING *`,
      [
        id, specialty_name, specialty_code, description, 
        duration, form_of_education, budget_places, cost_per_year, passing_score
      ]
    );

    res.status(CONSTANTS.HTTP_STATUS.CREATED).json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка при создании специальности:', error);
    res.status(CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR)
       .json({ message: 'Ошибка сервера при создании специальности' });
  }
});

module.exports = router;