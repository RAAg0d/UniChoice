// Сервис для работы с университетами
const pool = require('../db/pool');
const { normalizeValue, handleDatabaseError, createValidationError } = require('../utils');
const CONSTANTS = require('../constants');

/**
 * Сервис для работы с университетами
 */
class UniversityService {
  /**
   * Получить список университетов с фильтрацией и пагинацией
   * @param {Object} options - параметры запроса
   * @returns {Promise<Object>} список университетов и метаданные
   */
  async getUniversities(options = {}) {
    const {
      page = 1,
      limit = CONSTANTS.PAGINATION.DEFAULT_LIMIT,
      name,
      location,
      specialty,
      sortBy = 'popularity',
      sortOrder = 'desc',
      includeAdditive = false
    } = options;

    const offset = (page - 1) * limit;
    const order = sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC';

    try {
      // Базовый запрос
      let baseSelect = `
        SELECT u.*, 
               COALESCE(AVG(r.rating)::numeric(10, 1), 0) AS average_rating,
               COALESCE((
                 SELECT COUNT(*) FROM admission_applications aa
                 JOIN specialties s ON s.specialty_id = aa.specialty_id
                 WHERE s.universities_id = u.universities_id
               ), 0) AS total_applications,
               /*
                * === ВЫЧИСЛЕНИЕ ЧАСТОТЫ ПОДАЧИ ЗАЯВЛЕНИЙ ===
                */
               COALESCE((
                 SELECT CASE
                   WHEN COUNT(aa.created_at) > 1 THEN
                     (MAX(aa.created_at)::date - MIN(aa.created_at)::date) / (COUNT(aa.created_at) - 1)::float
                   ELSE NULL
                 END
                 FROM admission_applications aa
                 JOIN specialties s ON s.specialty_id = aa.specialty_id
                 WHERE s.universities_id = u.universities_id
               ), 0) AS application_frequency,
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

      // Фильтры
      const whereClauses = [];
      const params = [];
      let idx = 1;
      
      if (name) { 
        whereClauses.push(`u.name ILIKE $${idx++}`); 
        params.push(`%${name}%`); 
      }
      if (location) { 
        whereClauses.push(`u.location ILIKE $${idx++}`); 
        params.push(`%${location}%`); 
      }
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

      baseSelect += ` GROUP BY u.universities_id`;

      // Сортировка
      let orderBy = '';
      switch (sortBy.toLowerCase()) {
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
          orderBy = ` ORDER BY total_applications DESC`;
          break;
        case 'popularity':
        default:
          orderBy = ` ORDER BY total_applications ${order}`;
          break;
      }

      // Получение всех университетов для нормализации (если нужен аддитивный критерий)
      let allStatsForNormalization = [];
      if (includeAdditive) {
        try {
          const allUnisQuery = baseSelect;
          const allUnisForCalc = await pool.query(allUnisQuery, params);
          allStatsForNormalization = allUnisForCalc.rows;
        } catch (err) {
          console.error('Ошибка при получении всех университетов для расчета:', err);
          allStatsForNormalization = [];
        }
      }

      // Пагинированные данные
      const paginatedQuery = baseSelect + orderBy + ` LIMIT $${idx} OFFSET $${idx + 1}`;
      const allUniversities = await pool.query(paginatedQuery, [...params, limit, offset]);

      // Вычисление аддитивного критерия
      let universitiesWithAdditive = allUniversities.rows.map(uni => {
        if (includeAdditive) {
          try {
            const additive = this.calculateAdditiveCriterion(uni, allStatsForNormalization);
            return { ...uni, additive_criterion: additive.additive_criterion };
          } catch (err) {
            console.error('Ошибка при расчете аддитивного критерия:', err);
            return uni;
          }
        }
        return uni;
      });

      // Сортировка по аддитивному критерию
      if (includeAdditive && sortBy.toLowerCase() === 'additive') {
        universitiesWithAdditive = universitiesWithAdditive.sort((a, b) => {
          return order === 'ASC' 
            ? a.additive_criterion - b.additive_criterion 
            : b.additive_criterion - a.additive_criterion;
        });
      }

      // Подсчет общего количества
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

      return {
        universities: universitiesWithAdditive,
        totalPages,
        currentPage: page,
        totalCount: Number(totalCount.rows[0]?.count || 0)
      };
    } catch (error) {
      throw handleDatabaseError(error);
    }
  }

  /**
   * Получить университет по ID
   * @param {number} id - ID университета
   * @returns {Promise<Object>} данные университета
   */
  async getUniversityById(id) {
    try {
      const result = await pool.query(
        `SELECT 
           u.*, 
           COALESCE(AVG(r.rating)::numeric(10,1), 0) AS average_rating,
           COALESCE((
             SELECT COUNT(*) FROM admission_applications aa
             JOIN specialties s ON s.specialty_id = aa.specialty_id
             WHERE s.universities_id = u.universities_id
           ), 0) AS total_applications,
           COALESCE((
             SELECT CASE
               WHEN COUNT(aa.created_at) > 1 THEN
                 (MAX(aa.created_at)::date - MIN(aa.created_at)::date) / (COUNT(aa.created_at) - 1)::float
               ELSE NULL
             END
             FROM admission_applications aa
             JOIN specialties s ON s.specialty_id = aa.specialty_id
             WHERE s.universities_id = u.universities_id
           ), 0) AS application_frequency,
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

      if (result.rows.length === 0) {
        throw createValidationError('Вуз не найден', CONSTANTS.HTTP_STATUS.NOT_FOUND);
      }

      return result.rows[0];
    } catch (error) {
      throw handleDatabaseError(error);
    }
  }

  /**
   * Вычисление аддитивного критерия для университета
   * @param {Object} stats - статистика университета
   * @param {Array} allStats - статистика всех университетов для нормализации
   * @returns {Object} результат расчета
   */
  calculateAdditiveCriterion(stats, allStats) {
    if (!allStats || allStats.length === 0) {
      return { additive_criterion: 0 };
    }

    // Массивы для нормализации
    const totalApps = allStats.map(s => s.total_applications || 0).filter(v => !isNaN(v));
    const appFreqs = allStats.map(s => s.application_frequency || 0).filter(v => !isNaN(v));
    const daysSince = allStats.map(s => s.days_since_last_application || 0).filter(v => v !== null && !isNaN(v));

    const ranges = {
      average_rating: { min: 0, max: 5 },
      total_applications: {
        min: totalApps.length > 0 ? Math.min(...totalApps) : 0,
        max: totalApps.length > 0 ? Math.max(...totalApps) : 1
      },
      application_frequency: {
        min: appFreqs.length > 0 ? Math.min(...appFreqs) : 0,
        max: appFreqs.length > 0 ? Math.max(...appFreqs) : 1
      },
      days_since_last_application: {
        min: daysSince.length > 0 ? Math.min(...daysSince) : 0,
        max: daysSince.length > 0 ? Math.max(...daysSince) : 1
      }
    };

    // Проверяем, что max > min для всех диапазонов (особенно для application_frequency)
    Object.keys(ranges).forEach(key => {
      if (ranges[key].max === ranges[key].min) {
        if (key === 'application_frequency') {
          // Безопасный диапазон, если только один вуз или одинаковая частота
          ranges[key].min = 0;
          ranges[key].max = ranges[key].max === 0 ? 1 : ranges[key].max * 2;
        } else {
          ranges[key].max = ranges[key].min + 1;
        }
      }
    });

    // Нормализация значений
    const normalized = {
      average_rating: stats.average_rating ? normalizeValue(stats.average_rating, ranges.average_rating.min, ranges.average_rating.max) : 0,
      total_applications: stats.total_applications ? normalizeValue(stats.total_applications, ranges.total_applications.min, ranges.total_applications.max) : 0,
      application_frequency: stats.application_frequency !== null && !isNaN(stats.application_frequency)
        ? normalizeValue(stats.application_frequency, ranges.application_frequency.min, ranges.application_frequency.max)
        : 0.5,
      days_since_last_application: stats.days_since_last_application !== null && !isNaN(stats.days_since_last_application) ? normalizeValue(stats.days_since_last_application, ranges.days_since_last_application.min, ranges.days_since_last_application.max) : 0.5
    };
    // инверсия, чтобы меньшая частота (лучше) давала больший вклад
    const invertedFreq = 1 - normalized.application_frequency;
    const invertedDaysSince = 1 - normalized.days_since_last_application;

    // DEBUG: логируем детали нормализации/инверсии
    console.log('DEBUG: Additive', {
      application_frequency: stats.application_frequency,
      normFreq: normalized.application_frequency,
      invertedFreq,
      normDays: normalized.days_since_last_application,
      invertedDaysSince,
      rangeFreq: ranges.application_frequency
    });

    const weights = CONSTANTS.ADDITIVE_WEIGHTS;
    const additiveCriterion = 
      normalized.average_rating * weights.AVERAGE_RATING +
      normalized.total_applications * weights.TOTAL_APPLICATIONS +
      invertedFreq * weights.APPLICATION_FREQUENCY +
      invertedDaysSince * weights.DAYS_SINCE_LAST_APPLICATION;

    return {
      additive_criterion: Number(additiveCriterion.toFixed(4)),
      weights_used: weights,
      normalized_values: normalized
    };
  }
}

module.exports = new UniversityService();
