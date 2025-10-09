// Core dependencies
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

// App configuration
const env = require('./config/env');
const pool = require('./db/pool');
const { authenticateToken, isAdmin, isRepresentative } = require('./middleware/auth');

// App init & configuration
const app = express();
const PORT = env.PORT; // Public API port
const JWT_SECRET = env.JWT_SECRET; // NOTE: use env secret
const FRONTEND_ORIGIN = env.FRONTEND_ORIGIN;

// CORS policy — allow frontend dev server
app.use(cors({
  origin: FRONTEND_ORIGIN,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(bodyParser.json());

// Global process-level error handlers (keep server alive and log root causes)
process.on('uncaughtException', (error) => {
  console.error('Необработанное исключение:', error);
});

process.on('unhandledRejection', (error) => {
  console.error('Необработанное отклонение промиса:', error);
});

pool.connect()
  .then(() => {
    console.log('Успешное подключение к базе данных');
  })
  .catch((err) => {
    console.error('Ошибка подключения к базе данных:', err);
  });

// Auth middlewares are provided by ./middleware/auth

// Routers
const authRouter = require('./routes/auth.routes');
const universitiesRouter = require('./routes/universities.routes');

app.use(authRouter);
app.use('/universities', universitiesRouter);

// Universities: list with filters and aggregate stats
app.get('/universities', async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 10;
  const offset = (page - 1) * limit;

  const { rating, location } = req.query;

  try {
    let query = `
      SELECT u.*, 
             COALESCE(AVG(r.rating)::numeric(10, 1), 0) AS average_rating,
             -- Общее количество заявлений во все спец-ти вуза
             COALESCE((
               SELECT COUNT(*) FROM admission_applications aa
               JOIN specialties s ON s.specialty_id = aa.specialty_id
               WHERE s.universities_id = u.universities_id
             ), 0) AS total_applications,
             -- Количество заявлений за последние 30 дней
             COALESCE((
               SELECT COUNT(*) FROM admission_applications aa
               JOIN specialties s ON s.specialty_id = aa.specialty_id
               WHERE s.universities_id = u.universities_id
                 AND aa.created_at >= NOW() - INTERVAL '30 days'
             ), 0) AS applications_last_30_days,
             -- Дни с последней подачи заявления (NULL если не было)
             (
               SELECT 
                 CASE WHEN MAX(aa.created_at) IS NULL 
                      THEN NULL 
                      ELSE EXTRACT(DAY FROM (NOW() - MAX(aa.created_at)))::int 
                 END
               FROM admission_applications aa
               JOIN specialties s ON s.specialty_id = aa.specialty_id
               WHERE s.universities_id = u.universities_id
             ) AS days_since_last_application
      FROM universities u
      LEFT JOIN reviews r ON u.universities_id = r.university_id
    `;

    const whereClauses = [];
    if (location) {
      whereClauses.push(`u.location ILIKE '%${location}%'`);
    }

    if (whereClauses.length > 0) {
      query += ` WHERE ${whereClauses.join(' AND ')}`;
    }

    query += `
      GROUP BY u.universities_id
      HAVING COALESCE(AVG(r.rating)::numeric(10, 1), 0) >= ${rating || 0}
      LIMIT $1 OFFSET $2
    `;

    const allUniversities = await pool.query(query, [limit, offset]);

    const totalCountQuery = `
      SELECT COUNT(*) FROM (
        SELECT u.universities_id
        FROM universities u
        LEFT JOIN reviews r ON u.universities_id = r.university_id
        ${whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : ''}
        GROUP BY u.universities_id
        HAVING COALESCE(AVG(r.rating)::numeric(10, 1), 0) >= ${rating || 0}
      ) AS filtered_universities
    `;

    const totalCount = await pool.query(totalCountQuery);
    const totalPages = Math.ceil(totalCount.rows[0].count / limit);

    res.json({ universities: allUniversities.rows, totalPages });
  } catch (error) {
    console.error('Ошибка при получении списка вузов:', error);
    res.status(500).json({ message: 'Не удалось загрузить данные' });
  }
});

app.get('/universities/random', async (req, res) => {
  try {
    const randomUniversity = await pool.query(`
      SELECT * FROM universities
      ORDER BY RANDOM()
      LIMIT 1
    `);

    if (randomUniversity.rows.length === 0) {
      return res.status(404).json({ message: 'Вузы не найдены' });
    }

    res.json(randomUniversity.rows[0]);
  } catch (error) {
    console.error('Ошибка при получении случайного вуза:', error);
    res.status(500).json({ message: 'Не удалось загрузить данные' });
  }
});

app.get('/universities/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const university = await pool.query(
      `SELECT 
         u.*, 
         COALESCE(AVG(r.rating)::numeric(10,1), 0) AS average_rating,
         COALESCE((
           SELECT COUNT(*) FROM admission_applications aa
           JOIN specialties s ON s.specialty_id = aa.specialty_id
           WHERE s.universities_id = u.universities_id
         ), 0) AS total_applications,
         COALESCE((
           SELECT COUNT(*) FROM admission_applications aa
           JOIN specialties s ON s.specialty_id = aa.specialty_id
           WHERE s.universities_id = u.universities_id
             AND aa.created_at >= NOW() - INTERVAL '30 days'
         ), 0) AS applications_last_30_days,
         (
           SELECT 
             CASE WHEN MAX(aa.created_at) IS NULL 
                  THEN NULL 
                  ELSE EXTRACT(DAY FROM (NOW() - MAX(aa.created_at)))::int 
             END
           FROM admission_applications aa
           JOIN specialties s ON s.specialty_id = aa.specialty_id
           WHERE s.universities_id = u.universities_id
         ) AS days_since_last_application
       FROM universities u
       LEFT JOIN reviews r ON u.universities_id = r.university_id
       WHERE u.universities_id = $1
       GROUP BY u.universities_id`, 
      [id]
    );

    if (university.rows.length === 0) {
      return res.status(404).json({ message: 'Вуз не найден' });
    }

    res.json(university.rows[0]);
  } catch (error) {
    console.error('Ошибка при получении информации о вузе:', error);
    res.status(500).json({ message: error.message });
  }
});

// Создание нового университета (только для админов)
app.post('/universities', isAdmin, async (req, res) => {
  try {
    const { name, description, location } = req.body;

    if (!name || !description || !location) {
      return res.status(400).json({ message: 'Все поля обязательны для заполнения' });
    }

    const result = await pool.query(
      `INSERT INTO universities (name, description, location) 
       VALUES ($1, $2, $3) 
       RETURNING *`,
      [name, description, location]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка при создании университета:', error);
    res.status(500).json({ message: 'Ошибка сервера при создании университета' });
  }
});

// Обновление университета (только для админов)
app.put('/universities/:id', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, location } = req.body;

    if (!name || !description || !location) {
      return res.status(400).json({ message: 'Все поля обязательны для заполнения' });
    }

    const result = await pool.query(
      `UPDATE universities 
       SET name = $1, description = $2, location = $3 
       WHERE universities_id = $4 
       RETURNING *`,
      [name, description, location, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Университет не найден' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка при обновлении университета:', error);
    res.status(500).json({ message: 'Ошибка сервера при обновлении университета' });
  }
});

// Удаление университета (только для админов)
app.delete('/universities/:id', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM universities WHERE universities_id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Университет не найден' });
    }

    res.json({ message: 'Университет успешно удален' });
  } catch (error) {
    console.error('Ошибка при удалении университета:', error);
    res.status(500).json({ message: 'Ошибка сервера при удалении университета' });
  }
});

app.get('/universities/:id/reviews', async (req, res) => {
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
    res.status(500).json({ message: error.message });
  }
});

app.post('/universities/:id/reviews', async (req, res) => {
  const { id } = req.params;
  const { user_id, rating, comment } = req.body;

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ message: 'Оценка должна быть от 1 до 5' });
  }

  try {
    const newReview = await pool.query(
      `INSERT INTO reviews (university_id, user_id, rating, comment) 
       VALUES ($1, $2, $3, $4) 
       RETURNING reviews.*, 
       (SELECT full_name FROM users WHERE users_id = $2) AS full_name`,
      [id, user_id, rating, comment]
    );

    res.status(201).json(newReview.rows[0]);
  } catch (error) {
    console.error('Ошибка при добавлении отзыва:', error);
    res.status(500).json({ message: error.message });
  }
});

app.get('/users', isAdmin, async (req, res) => {
  try {
    const allUsers = await pool.query(`
      SELECT 
        users_id, 
        full_name, 
        email, 
        user_type, 
        is_banned,
        registration_date
      FROM users
      ORDER BY registration_date DESC
    `);
    res.json(allUsers.rows);
  } catch (error) {
    console.error('Ошибка при получении списка пользователей:', error);
    res.status(500).json({ message: error.message });
  }
});

app.delete('/reviews/:id', isAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query('DELETE FROM reviews WHERE reviews_id = $1', [id]);
    res.json({ message: 'Отзыв удален' });
  } catch (error) {
    console.error('Ошибка при удалении отзыва:', error);
    res.status(500).json({ message: error.message });
  }
});

app.put('/users/:id/ban', isAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query('UPDATE users SET is_banned = TRUE WHERE users_id = $1', [id]);
    res.json({ message: 'Пользователь заблокирован' });
  } catch (error) {
    console.error('Ошибка при блокировке пользователя:', error);
    res.status(500).json({ message: error.message });
  }
});

app.put('/users/:id/unban', isAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    await pool.query('UPDATE users SET is_banned = FALSE WHERE users_id = $1', [id]);
    res.json({ message: 'Пользователь разблокирован' });
  } catch (error) {
    console.error('Ошибка при разблокировке пользователя:', error);
    res.status(500).json({ message: error.message });
  }
});

app.post('/university-applications', isRepresentative, async (req, res) => {
  try {
    if (req.user.user_type !== 'university_representative') {
      return res.status(403).json({ message: 'Доступ запрещен' });
    }

    const { university_name, description, location, specialties } = req.body;
    const representativeId = req.user.users_id; 

    const query = `
      INSERT INTO university_applications 
        (university_name, description, location, representative_id, status, specialties) 
      VALUES 
        ($1, $2, $3, $4, 'pending', $5)
      RETURNING *
    `;

    const { rows } = await pool.query(query, [
      university_name, 
      description, 
      location, 
      representativeId,
      JSON.stringify(specialties)
    ]);

    res.status(201).json(rows[0]);
  } catch (error) {
    console.error('Ошибка при создании заявки:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

app.get('/university-applications', authenticateToken, async (req, res) => {
  try {
    let query;
    if (req.user.user_type === 'admin') {
      query = `
        SELECT ua.*, u.full_name as representative_name 
        FROM university_applications ua
        JOIN users u ON ua.representative_id = u.users_id
        ORDER BY ua.created_at DESC
      `;
      const result = await pool.query(query);
      res.json(result.rows);
    } else if (req.user.user_type === 'university_representative') {
      query = `
        SELECT * FROM university_applications 
        WHERE representative_id = $1 
        ORDER BY created_at DESC
      `;
      const result = await pool.query(query, [req.user.users_id]);
      res.json(result.rows);
    } else {
      res.status(403).json({ message: 'Доступ запрещен' });
    }
  } catch (error) {
    console.error('Ошибка при получении заявок:', error);
    res.status(500).json({ message: 'Ошибка сервера при получении заявок' });
  }
});

app.put('/university-applications/:id/process', isAdmin, async (req, res) => {
  const { id } = req.params;
  const { status, admin_comment } = req.body;

  try {
    const updatedApplication = await pool.query(
      `UPDATE university_applications 
       SET status = $1, admin_comment = $2 
       WHERE application_id = $3 
       RETURNING *`,
      [status, admin_comment, id]
    );

    if (status === 'approved') {
      const application = updatedApplication.rows[0];
      
      // Добавляем университет
      const universityResult = await pool.query(
        `INSERT INTO universities (name, description, location) 
         VALUES ($1, $2, $3)
         RETURNING universities_id`,
        [application.university_name, application.description, application.location]
      );
      
      const universityId = universityResult.rows[0].universities_id;
      
      // Добавляем специальности, если они есть
      if (application.specialties) {
        const specialties = typeof application.specialties === 'string' 
          ? JSON.parse(application.specialties) 
          : application.specialties;
          
        for (const specialty of specialties) {
          await pool.query(
            `INSERT INTO specialties (
              universities_id,
              specialty_name,
              specialty_code,
              description,
              duration,
              form_of_education,
              budget_places,
              cost_per_year,
              passing_score
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [
              universityId,
              specialty.specialty_name,
              specialty.specialty_code,
              specialty.description,
              specialty.duration,
              specialty.form_of_education,
              parseInt(specialty.budget_places),
              parseInt(specialty.cost_per_year),
              parseInt(specialty.passing_score)
            ]
          );
        }
      }
    }

    res.json(updatedApplication.rows[0]);
  } catch (error) {
    console.error('Детальная ошибка:', error);
    res.status(500).json({ message: error.message });
  }
});

app.get('/admission-applications/university', authenticateToken, async (req, res) => {
  try {
    console.log('1. Запрос получен');
    console.log('2. Данные пользователя:', {
      id: req.user.users_id,
      email: req.user.email,
      type: req.user.user_type
    });

    if (req.user.user_type !== 'university_representative') {
      console.log('3. Неверный тип пользователя');
      return res.status(403).json({ message: 'Доступ запрещен' });
    }

    const checkQuery = await pool.query('SELECT COUNT(*) FROM admission_applications');
    console.log('4. Количество заявлений в базе:', checkQuery.rows[0].count);

    const result = await pool.query(`
      SELECT 
        aa.application_id,
        aa.phone_number,
        aa.total_score,
        aa.wants_budget,
        aa.status,
        aa.created_at,
        u.full_name as applicant_name,
        u.email as applicant_email,
        s.specialty_name,
        s.specialty_code,
        univ.name as university_name
      FROM admission_applications aa
      JOIN users u ON aa.user_id = u.users_id
      JOIN specialties s ON aa.specialty_id = s.specialty_id
      JOIN universities univ ON s.universities_id = univ.universities_id
      ORDER BY aa.created_at DESC
    `);

    console.log('5. Результат запроса:', {
      rowCount: result.rows.length,
      firstRow: result.rows[0]
    });

    res.json(result.rows);

  } catch (error) {
    console.error('Детальная ошибка:', {
      message: error.message,
      stack: error.stack,
      query: error.query
    });
    res.status(500).json({ 
      message: 'Ошибка сервера при получении заявлений',
      details: error.message 
    });
  }
});

app.post('/admission-applications', authenticateToken, async (req, res) => {
  try {
    const { specialtyId, phoneNumber, totalScore, wantsBudget } = req.body;
    const userId = req.user.users_id;

    if (req.user.user_type === 'university_representative') {
      return res.status(403).json({ message: 'Представители вузов не могут подавать заявления' });
    }

    const existingApplication = await pool.query(
      'SELECT * FROM admission_applications WHERE user_id = $1 AND specialty_id = $2',
      [userId, specialtyId]
    );

    if (existingApplication.rows.length > 0) {
      return res.status(400).json({ message: 'Вы уже подали заявление на эту специальность' });
    }

    const result = await pool.query(
      `INSERT INTO admission_applications 
       (user_id, specialty_id, phone_number, total_score, wants_budget) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [userId, specialtyId, phoneNumber, totalScore, wantsBudget]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка при создании заявления:', error);
    res.status(500).json({ message: 'Ошибка сервера при создании заявления' });
  }
});

app.get('/universities/:id/specialties', async (req, res) => {
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
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Создание новой специальности (только для админов)
app.post('/universities/:id/specialties', isAdmin, async (req, res) => {
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
      return res.status(400).json({ message: 'Название и код специальности обязательны' });
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

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка при создании специальности:', error);
    res.status(500).json({ message: 'Ошибка сервера при создании специальности' });
  }
});

// Обновление специальности (только для админов)
app.put('/specialties/:id', isAdmin, async (req, res) => {
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
      return res.status(400).json({ message: 'Название и код специальности обязательны' });
    }

    const result = await pool.query(
      `UPDATE specialties 
       SET specialty_name = $1, specialty_code = $2, description = $3, 
           duration = $4, form_of_education = $5, budget_places = $6, 
           cost_per_year = $7, passing_score = $8
       WHERE specialty_id = $9 
       RETURNING *`,
      [
        specialty_name, specialty_code, description, 
        duration, form_of_education, budget_places, 
        cost_per_year, passing_score, id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Специальность не найдена' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка при обновлении специальности:', error);
    res.status(500).json({ message: 'Ошибка сервера при обновлении специальности' });
  }
});

// Удаление специальности (только для админов)
app.delete('/specialties/:id', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM specialties WHERE specialty_id = $1 RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Специальность не найдена' });
    }

    res.json({ message: 'Специальность успешно удалена' });
  } catch (error) {
    console.error('Ошибка при удалении специальности:', error);
    res.status(500).json({ message: 'Ошибка сервера при удалении специальности' });
  }
});

app.put('/admission-applications/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (req.user.user_type !== 'university_representative') {
      return res.status(403).json({ message: 'Только представители вузов могут изменять статус заявлений' });
    }

    const result = await pool.query(
      `UPDATE admission_applications 
       SET status = $1 
       WHERE application_id = $2 
       RETURNING *`,
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Заявление не найдено' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка при обновлении статуса:', error);
    res.status(500).json({ message: 'Ошибка сервера при обновлении статуса' });
  }
});

app.get('/admission-applications/my', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        aa.application_id,
        aa.phone_number,
        aa.total_score,
        aa.wants_budget,
        aa.status,
        aa.created_at,
        s.specialty_name,
        s.specialty_code,
        univ.name as university_name
      FROM admission_applications aa
      JOIN specialties s ON aa.specialty_id = s.specialty_id
      JOIN universities univ ON s.universities_id = univ.universities_id
      WHERE aa.user_id = $1
      ORDER BY aa.created_at DESC
    `, [req.user.users_id]);

    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка при получении заявлений:', error);
    res.status(500).json({ message: 'Ошибка сервера при получении заявлений' });
  }
});

app.get('/top-university', async (req, res) => {
  try {
    const query = `
      SELECT 
        u.universities_id,
        u.name,
        u.description,
        u.location,
        COALESCE(
          (SELECT AVG(rating)::numeric(10,1) 
           FROM reviews 
           WHERE university_id = u.universities_id
          ), 
          0
        ) as average_rating,
        (SELECT COUNT(*) 
         FROM reviews 
         WHERE university_id = u.universities_id
        ) as review_count
      FROM universities u
      ORDER BY average_rating DESC, review_count DESC
      LIMIT 1;
    `;

    console.log('Выполняем запрос...');
    const result = await pool.query(query);
    console.log('Результат запроса:', result.rows);

    if (result.rows.length === 0) {
      console.log('Вузы не найдены');
      return res.status(404).json({ message: 'Вузы не найдены' });
    }

    const university = {
      ...result.rows[0],
      average_rating: Number(result.rows[0].average_rating || 0).toFixed(1)
    };

    console.log('Отправляем ответ:', university);
    res.json(university);

  } catch (error) {
    console.error('Детальная ошибка:', {
      message: error.message,
      stack: error.stack,
      query: error.query
    });
    res.status(500).json({ 
      message: 'Не удалось загрузить данные',
      details: error.message 
    });
  }
});

// Централизованная обработка ошибок
app.use((err, req, res, next) => {
  console.error('Ошибка сервера:', err);
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({ 
      message: 'Ошибка валидации', 
      details: err.message 
    });
  }
  
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ 
      message: 'Неавторизованный доступ' 
    });
  }
  
  if (err.code === '23505') { // PostgreSQL unique violation
    return res.status(409).json({ 
      message: 'Запись с такими данными уже существует' 
    });
  }
  
  if (err.code === '23503') { // PostgreSQL foreign key violation
    return res.status(400).json({ 
      message: 'Нарушение связности данных' 
    });
  }
  
  res.status(500).json({ 
    message: 'Внутренняя ошибка сервера',
    ...(process.env.NODE_ENV === 'development' && { details: err.message })
  });
});

// Обработка 404 для несуществующих маршрутов
app.use('*', (req, res) => {
  res.status(404).json({ 
    message: 'Маршрут не найден',
    path: req.originalUrl 
  });
});

app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});