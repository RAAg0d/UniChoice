// Маршруты для работы с университетами
const express = require('express');
const pool = require('../db/pool'); // Подключение к базе данных
const { isAdmin } = require('../middleware/auth'); // Middleware для проверки прав администратора

const router = express.Router();

// Нормализация значений для аддитивного критерия
const normalizeValue = (value, min, max) => {
  if (max === min) return 0.5; // Если все значения одинаковые
  return Math.max(0, Math.min(1, (value - min) / (max - min)));
};

// Вычисление аддитивного критерия для университета
const calculateAdditiveCriterion = (stats, allStats) => {
  // Если нет данных для нормализации, возвращаем 0
  if (!allStats || allStats.length === 0) {
    console.log('⚠️ Нет данных для нормализации');
    return { additive_criterion: 0 };
  }
  
  console.log('📈 Рассчитываем аддитивный критерий для вуза:', stats.universities_id);

  const weights = {
    average_rating: 0.25,           // Средняя оценка - 25%
    total_applications: 0.20,      // Количество заявлений - 20%
    applications_last_30_days: 0.20, // Заявления за 30 дней - 20%
    days_since_last_application: 0.15, // Дни с последнего заявления - 15%
  };

  // Находим мин/макс для нормализации
  const totalApps = allStats.map(s => s.total_applications || 0).filter(v => !isNaN(v));
  const apps30Days = allStats.map(s => s.applications_last_30_days || 0).filter(v => !isNaN(v));
  const daysSince = allStats.map(s => s.days_since_last_application || 0).filter(v => v !== null && !isNaN(v));

  const ranges = {
    average_rating: { min: 0, max: 5 }, // Рейтинг от 0 до 5
    total_applications: {
      min: totalApps.length > 0 ? Math.min(...totalApps) : 0,
      max: totalApps.length > 0 ? Math.max(...totalApps) : 1
    },
    applications_last_30_days: {
      min: apps30Days.length > 0 ? Math.min(...apps30Days) : 0,
      max: apps30Days.length > 0 ? Math.max(...apps30Days) : 1
    },
    days_since_last_application: {
      min: daysSince.length > 0 ? Math.min(...daysSince) : 0,
      max: daysSince.length > 0 ? Math.max(...daysSince) : 1
    }
  };

  // Проверяем, что max > min для всех диапазонов
  Object.keys(ranges).forEach(key => {
    if (ranges[key].max === ranges[key].min) {
      ranges[key].max = ranges[key].min + 1;
    }
  });

  // Нормализуем значения
  const normalized = {
    average_rating: stats.average_rating ? normalizeValue(stats.average_rating, ranges.average_rating.min, ranges.average_rating.max) : 0,
    total_applications: stats.total_applications ? normalizeValue(stats.total_applications, ranges.total_applications.min, ranges.total_applications.max) : 0,
    applications_last_30_days: stats.applications_last_30_days ? normalizeValue(stats.applications_last_30_days, ranges.applications_last_30_days.min, ranges.applications_last_30_days.max) : 0,
    days_since_last_application: stats.days_since_last_application !== null && !isNaN(stats.days_since_last_application) ? normalizeValue(stats.days_since_last_application, ranges.days_since_last_application.min, ranges.days_since_last_application.max) : 0.5
  };

  // Для дней с последнего заявления инвертируем (меньше дней = лучше)
  const invertedDaysSince = 1 - normalized.days_since_last_application;

  // Вычисляем аддитивный критерий: R = Σ(w_i * f_i)
  const additiveCriterion = 
    normalized.average_rating * weights.average_rating +
    normalized.total_applications * weights.total_applications +
    normalized.applications_last_30_days * weights.applications_last_30_days +
    invertedDaysSince * weights.days_since_last_application;

  console.log('📊 Нормализованные значения:', normalized);
  console.log('🎯 Аддитивный критерий:', additiveCriterion);

  return {
    additive_criterion: Number(additiveCriterion.toFixed(4)),
    weights_used: weights,
    normalized_values: normalized
  };
};

// GET /universities (list with aggregates + аддитивный критерий)
router.get('/', async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 10;
  const offset = (page - 1) * limit;
  const { name, location, specialty, sortBy, sortOrder, includeAdditive } = req.query;
  const order = (sortOrder || 'desc').toLowerCase() === 'asc' ? 'ASC' : 'DESC';
  const shouldCalculateAdditive = includeAdditive === 'true' || includeAdditive === true || includeAdditive === '1';
  
  console.log('🔍 Запрос получен:', { includeAdditive, type: typeof includeAdditive, shouldCalculateAdditive });
  
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
      case 'additive':
        // Сортировка по аддитивному критерию будет сделана на стороне JS после расчета
        orderBy = ` ORDER BY total_applications DESC`;
        break;
      case 'popularity':
      default:
        orderBy = ` ORDER BY total_applications ${order}`;
        break;
    }

    // Если нужен аддитивный критерий, получаем ВСЕ университеты сначала (для нормализации)
    let allStatsForNormalization = [];
    if (shouldCalculateAdditive) {
      try {
        // Создаем запрос для всех университетов без пагинации
        let allUnisQuery = `
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
        if (whereClauses.length > 0) {
          allUnisQuery += ` WHERE ${whereClauses.join(' AND ')}`;
        }
        allUnisQuery += ` GROUP BY u.universities_id`;
        
        const allUnisForCalc = await pool.query(allUnisQuery, params);
        allStatsForNormalization = allUnisForCalc.rows;
        console.log('📊 Получено университетов для нормализации:', allStatsForNormalization.length);
      } catch (err) {
        console.error('❌ Ошибка при получении всех университетов для расчета:', err);
        // Если не удалось получить все данные, работаем без аддитивного критерия
        allStatsForNormalization = [];
      }
    }

    // Запрашиваем пагинированные данные
    const paginatedQuery = baseSelect + orderBy + ` LIMIT $${idx} OFFSET $${idx + 1}`;
    const allUniversities = await pool.query(paginatedQuery, [...params, limit, offset]);

    // Вычисляем аддитивный критерий для каждого университета
    let universitiesWithAdditive = allUniversities.rows.map(uni => {
      if (shouldCalculateAdditive) {
        try {
          const additive = calculateAdditiveCriterion(uni, allStatsForNormalization);
          console.log('📊 Рассчитан аддитивный критерий для вуза:', uni.universities_id, additive.additive_criterion);
          return { ...uni, additive_criterion: additive.additive_criterion };
        } catch (err) {
          console.error('Ошибка при расчете аддитивного критерия:', err);
          return uni;
        }
      }
      return uni;
    });
    
    console.log('✅ Всего университетов с аддитивным критерием:', universitiesWithAdditive.filter(u => u.additive_criterion !== undefined).length);

    // Сортировка по аддитивному критерию после расчета
    if (shouldCalculateAdditive && sortBy && sortBy.toLowerCase() === 'additive') {
      universitiesWithAdditive = universitiesWithAdditive.sort((a, b) => {
        return order === 'ASC' 
          ? a.additive_criterion - b.additive_criterion 
          : b.additive_criterion - a.additive_criterion;
      });
    }

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

    res.json({ universities: universitiesWithAdditive, totalPages });
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