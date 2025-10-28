// Константы приложения
module.exports = {
  // HTTP статусы
  HTTP_STATUS: {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    INTERNAL_SERVER_ERROR: 500
  },

  // Роли пользователей
  USER_ROLES: {
    STUDENT: 'student',
    UNIVERSITY_REPRESENTATIVE: 'university_representative',
    ADMIN: 'admin'
  },

  // Статусы заявлений
  APPLICATION_STATUS: {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected'
  },

  // Лимиты пагинации
  PAGINATION: {
    DEFAULT_LIMIT: 10,
    MAX_LIMIT: 100
  },

  // Валидация
  VALIDATION: {
    PASSWORD_MIN_LENGTH: 6,
    PASSWORD_MAX_LENGTH: 60,
    NAME_MAX_LENGTH: 100,
    EMAIL_MAX_LENGTH: 100,
    COMMENT_MAX_LENGTH: 150,
    EXAM_SCORE_MIN: 1,
    EXAM_SCORE_MAX: 999,
    ID_MIN: 1,
    ID_MAX: 999,
    RATING_MIN: 1,
    RATING_MAX: 5
  },

  // Форматы
  PHONE_REGEX: /^\+7\(\d{3}\)\d{7}$/,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,

  // Веса для аддитивного критерия
  ADDITIVE_WEIGHTS: {
    AVERAGE_RATING: 0.25,
    TOTAL_APPLICATIONS: 0.20,
    APPLICATIONS_LAST_30_DAYS: 0.20,
    DAYS_SINCE_LAST_APPLICATION: 0.15
  }
};
