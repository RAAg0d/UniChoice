// Утилиты для работы с данными
const CONSTANTS = require('../constants');

/**
 * Нормализация значения для аддитивного критерия
 * @param {number} value - значение для нормализации
 * @param {number} min - минимальное значение
 * @param {number} max - максимальное значение
 * @returns {number} нормализованное значение от 0 до 1
 */
const normalizeValue = (value, min, max) => {
  if (max === min) return 0.5; // Если все значения одинаковые
  return Math.max(0, Math.min(1, (value - min) / (max - min)));
};

/**
 * Нормализация номера телефона
 * @param {string} phoneNumber - номер телефона в любом формате
 * @returns {string|null} нормализованный номер или null
 */
const normalizePhoneNumber = (phoneNumber) => {
  const digits = String(phoneNumber).replace(/\D/g, '');
  let normalizedPhone = null;
  
  if (digits.length === 11 && digits.startsWith('8')) {
    // 8XXXXXXXXXX -> +7(XXX)XXXXXXX
    const d = '7' + digits.slice(1);
    normalizedPhone = `+7(${d.slice(1,4)})${d.slice(4,11)}`;
  } else if (digits.length === 11 && digits.startsWith('7')) {
    const d = digits;
    normalizedPhone = `+7(${d.slice(1,4)})${d.slice(4,11)}`;
  } else if (digits.length === 10) {
    const d = '7' + digits;
    normalizedPhone = `+7(${d.slice(1,4)})${d.slice(4,11)}`;
  }

  return normalizedPhone && CONSTANTS.PHONE_REGEX.test(normalizedPhone) ? normalizedPhone : null;
};

/**
 * Валидация email
 * @param {string} email - email для проверки
 * @returns {boolean} валидный ли email
 */
const isValidEmail = (email) => {
  return CONSTANTS.EMAIL_REGEX.test(email);
};

/**
 * Валидация ID
 * @param {any} id - ID для проверки
 * @returns {boolean} валидный ли ID
 */
const isValidId = (id) => {
  const parsedId = parseInt(id);
  return !isNaN(parsedId) && parsedId >= CONSTANTS.VALIDATION.ID_MIN && parsedId <= CONSTANTS.VALIDATION.ID_MAX;
};

/**
 * Валидация рейтинга
 * @param {any} rating - рейтинг для проверки
 * @returns {boolean} валидный ли рейтинг
 */
const isValidRating = (rating) => {
  const parsedRating = parseInt(rating);
  return !isNaN(parsedRating) && parsedRating >= CONSTANTS.VALIDATION.RATING_MIN && parsedRating <= CONSTANTS.VALIDATION.RATING_MAX;
};

/**
 * Валидация балла ЕГЭ
 * @param {any} score - балл для проверки
 * @returns {boolean} валидный ли балл
 */
const isValidExamScore = (score) => {
  const parsedScore = parseInt(score);
  return !isNaN(parsedScore) && parsedScore >= CONSTANTS.VALIDATION.EXAM_SCORE_MIN && parsedScore <= CONSTANTS.VALIDATION.EXAM_SCORE_MAX;
};

/**
 * Создание ошибки валидации
 * @param {string} message - сообщение об ошибке
 * @param {number} statusCode - код статуса
 * @returns {Error} объект ошибки
 */
const createValidationError = (message, statusCode = CONSTANTS.HTTP_STATUS.BAD_REQUEST) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

/**
 * Обработка ошибок базы данных
 * @param {Error} error - ошибка из базы данных
 * @returns {Object} обработанная ошибка
 */
const handleDatabaseError = (error) => {
  console.error('Database error:', error);
  
  switch (error.code) {
    case '23505': // unique violation
      return { message: 'Запись с такими данными уже существует', statusCode: CONSTANTS.HTTP_STATUS.BAD_REQUEST };
    case '23514': // check constraint violation
      return { message: 'Некорректные данные. Проверьте заполнение полей.', statusCode: CONSTANTS.HTTP_STATUS.BAD_REQUEST };
    case '23503': // foreign key violation
      return { message: 'Связанная запись не найдена', statusCode: CONSTANTS.HTTP_STATUS.BAD_REQUEST };
    default:
      return { message: 'Ошибка сервера', statusCode: CONSTANTS.HTTP_STATUS.INTERNAL_SERVER_ERROR };
  }
};

module.exports = {
  normalizeValue,
  normalizePhoneNumber,
  isValidEmail,
  isValidId,
  isValidRating,
  isValidExamScore,
  createValidationError,
  handleDatabaseError
};
