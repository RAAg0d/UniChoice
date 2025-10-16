// Маршруты для работы с университетами
const express = require('express');
const pool = require('../db/pool'); // Подключение к базе данных
const { isAdmin } = require('../middleware/auth'); // Middleware для проверки прав администратора

const router = express.Router();

// GET /universities (list with aggregates)
router.get('/', async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 10;
  const offset = (page - 1) * limit;
  const { name, location, specialty, sortBy, sortOrder } = req.query;
  const order = (sortOrder || 'desc').toLowerCase() === 'asc' ? 'ASC' : 'DESC';
  try {
    // Base select + aggregates
    let baseSelect = `
      SELECT u.*, 
             COALESCE(AVG(r.rating)::numeric(10, 1), 0) AS average_rating,
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
               SELECT CASE WHEN MAX(aa.created_at) IS NULL THEN NULL 
                           ELSE EXTRACT(DAY FROM (NOW() - MAX(aa.created_at)))::int END
               FROM admission_applications aa
               JOIN specialties s ON s.specialty_id = aa.specialty_id
               WHERE s.universities_id = u.universities_id
             ) AS days_since_last_application
      FROM universities u
      LEFT JOIN reviews r ON u.universities_id = r.university_id
    `;

    // Dynamic filters with parameters
    const whereClauses = [];
    const params = [];
    let idx = 1;
    if (name) { whereClauses.push(`u.name ILIKE $${idx++}`); params.push(`%${name}%`); }
    if (location) { whereClauses.push(`u.location ILIKE $${idx++}`); params.push(`%${location}%`); }
    if (specialty) {
      whereClauses.push(`EXISTS (
        SELECT 1 FROM specialties sp
        WHERE sp.universities_id = u.universities_id AND sp.specialty_name ILIKE $${idx}
      )`);
      params.push(`%${specialty}%`);
      idx++;
    }
    if (whereClauses.length > 0) {
      baseSelect += ` WHERE ${whereClauses.join(' AND ')}`;
    }

    // Grouping
    baseSelect += ` GROUP BY u.universities_id`;

    // Sorting
    let orderBy = '';
    switch ((sortBy || 'popularity').toLowerCase()) {
      case 'rating':
        orderBy = ` ORDER BY average_rating ${order}`;
        break;
      case 'name':
        orderBy = ` ORDER BY u.name ${order}`;
        break;
      case 'location':
        orderBy = ` ORDER BY u.location ${order}`;
        break;
      case 'popularity':
      default:
        orderBy = ` ORDER BY total_applications ${order}`;
        break;
    }

    const paginatedQuery = baseSelect + orderBy + ` LIMIT $${idx} OFFSET $${idx + 1}`;
    const allUniversities = await pool.query(paginatedQuery, [...params, limit, offset]);

    // total count: count of grouped rows matching filters
    let countQuery = `
      SELECT COUNT(*) FROM (
        SELECT u.universities_id
        FROM universities u
        LEFT JOIN reviews r ON u.universities_id = r.university_id
    `;
    if (whereClauses.length > 0) {
      countQuery += ` WHERE ${whereClauses.join(' AND ')}`;
    }
    countQuery += ` GROUP BY u.universities_id ) AS filtered_universities`;
    const totalCount = await pool.query(countQuery, params);
    const totalPages = Math.ceil((Number(totalCount.rows[0]?.count || 0)) / limit) || 1;

    res.json({ universities: allUniversities.rows, totalPages });
  } catch (e) {
    res.status(500).json({ message: 'Не удалось загрузить данные' });
  }
});

// GET /universities/random (get random university)
router.get('/random', async (req, res) => {
  try {
    const randomUniversity = await pool.query(`
      SELECT u.*, COALESCE(AVG(r.rating)::numeric(10,1), 0) AS average_rating,
             COALESCE((SELECT COUNT(*) FROM admission_applications aa JOIN specialties s ON s.specialty_id = aa.specialty_id WHERE s.universities_id = u.universities_id), 0) AS total_applications
      FROM universities u 
      LEFT JOIN reviews r ON u.universities_id = r.university_id
      GROUP BY u.universities_id
      ORDER BY RANDOM()
      LIMIT 1
    `);
    
    if (randomUniversity.rows.length === 0) {
      return res.status(404).json({ message: 'Вузы не найдены' });
    }
    
    res.json(randomUniversity.rows[0]);
  } catch (e) {
    res.status(500).json({ message: 'Ошибка при получении случайного вуза' });
  }
});

// GET /universities/:id (details with aggregates)
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const university = await pool.query(`
      SELECT u.*, COALESCE(AVG(r.rating)::numeric(10,1), 0) AS average_rating,
             COALESCE((SELECT COUNT(*) FROM admission_applications aa JOIN specialties s ON s.specialty_id = aa.specialty_id WHERE s.universities_id = u.universities_id), 0) AS total_applications,
             COALESCE((SELECT COUNT(*) FROM admission_applications aa JOIN specialties s ON s.specialty_id = aa.specialty_id WHERE s.universities_id = u.universities_id AND aa.created_at >= NOW() - INTERVAL '30 days'), 0) AS applications_last_30_days,
             (SELECT CASE WHEN MAX(aa.created_at) IS NULL THEN NULL ELSE EXTRACT(DAY FROM (NOW() - MAX(aa.created_at)))::int END FROM admission_applications aa JOIN specialties s ON s.specialty_id = aa.specialty_id WHERE s.universities_id = u.universities_id) AS days_since_last_application
      FROM universities u LEFT JOIN reviews r ON u.universities_id = r.university_id
      WHERE u.universities_id = $1
      GROUP BY u.universities_id
    `, [id]);
    if (university.rows.length === 0) return res.status(404).json({ message: 'Вуз не найден' });
    res.json(university.rows[0]);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Admin CRUD (create/update/delete)
router.post('/', isAdmin, async (req, res) => {
  try {
    const { name, description, location } = req.body;
    if (!name || !description || !location) return res.status(400).json({ message: 'Все поля обязательны для заполнения' });
    const r = await pool.query(`INSERT INTO universities (name, description, location) VALUES ($1,$2,$3) RETURNING *`, [name, description, location]);
    res.status(201).json(r.rows[0]);
  } catch (e) {
    res.status(500).json({ message: 'Ошибка сервера при создании университета' });
  }
});

router.put('/:id', isAdmin, async (req, res) => {
  try {
    const { id } = req.params; const { name, description, location } = req.body;
    if (!name || !description || !location) return res.status(400).json({ message: 'Все поля обязательны для заполнения' });
    const r = await pool.query(`UPDATE universities SET name=$1, description=$2, location=$3 WHERE universities_id=$4 RETURNING *`, [name, description, location, id]);
    if (r.rows.length === 0) return res.status(404).json({ message: 'Университет не найден' });
    res.json(r.rows[0]);
  } catch (e) {
    res.status(500).json({ message: 'Ошибка сервера при обновлении университета' });
  }
});

router.delete('/:id', isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const r = await pool.query('DELETE FROM universities WHERE universities_id=$1 RETURNING *', [id]);
    if (r.rows.length === 0) return res.status(404).json({ message: 'Университет не найден' });
    res.json({ message: 'Университет успешно удален' });
  } catch (e) {
    res.status(500).json({ message: 'Ошибка сервера при удалении университета' });
  }
});

module.exports = router;