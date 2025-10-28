// Контроллер для работы с университетами
const universityService = require('../services/universityService');
const CONSTANTS = require('../constants');

/**
 * Контроллер для университетов
 */
class UniversityController {
  /**
   * Получить список университетов
   * @param {Object} req - запрос
   * @param {Object} res - ответ
   */
  async getUniversities(req, res) {
    try {
      const options = {
        page: parseInt(req.query.page) || 1,
        limit: parseInt(req.query.limit) || CONSTANTS.PAGINATION.DEFAULT_LIMIT,
        name: req.query.name,
        location: req.query.location,
        specialty: req.query.specialty,
        sortBy: req.query.sortBy || 'popularity',
        sortOrder: req.query.sortOrder || 'desc',
        includeAdditive: req.query.includeAdditive === 'true'
      };

      console.log('🔍 Запрос получен:', { 
        includeAdditive: req.query.includeAdditive, 
        type: typeof req.query.includeAdditive, 
        shouldCalculateAdditive: options.includeAdditive 
      });

      const result = await universityService.getUniversities(options);
      
      console.log('✅ Всего университетов с аддитивным критерием:', 
        result.universities.filter(u => u.additive_criterion !== undefined).length);

      res.json(result);
    } catch (error) {
      console.error('Ошибка в контроллере университетов:', error);
      res.status(error.statusCode || CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR)
         .json({ message: error.message || 'Не удалось загрузить данные' });
    }
  }

  /**
   * Получить университет по ID
   * @param {Object} req - запрос
   * @param {Object} res - ответ
   */
  async getUniversityById(req, res) {
    try {
      const { id } = req.params;
      const university = await universityService.getUniversityById(id);
      res.json(university);
    } catch (error) {
      console.error('Ошибка при получении университета:', error);
      res.status(error.statusCode || CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR)
         .json({ message: error.message || 'Ошибка сервера' });
    }
  }

  /**
   * Получить случайный университет
   * @param {Object} req - запрос
   * @param {Object} res - ответ
   */
  async getRandomUniversity(req, res) {
    try {
      const pool = require('../db/pool');
      const randomUniversity = await pool.query(`
        SELECT * FROM universities
        ORDER BY RANDOM()
        LIMIT 1
      `);

      if (randomUniversity.rows.length === 0) {
        return res.status(CONSTANTS.HTTP_STATUS.NOT_FOUND)
                  .json({ message: 'Вузы не найдены' });
      }

      res.json(randomUniversity.rows[0]);
    } catch (error) {
      console.error('Ошибка при получении случайного вуза:', error);
      res.status(CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR)
         .json({ message: 'Не удалось загрузить данные' });
    }
  }
}

module.exports = new UniversityController();
