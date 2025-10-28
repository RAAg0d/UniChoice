// Утилиты для frontend
import { API_BASE_URL, PHONE_REGEX, EMAIL_REGEX, VALIDATION } from './constants';

/**
 * Выполнение HTTP запроса
 * @param {string} url - URL для запроса
 * @param {Object} options - опции запроса
 * @returns {Promise<Object>} результат запроса
 */
export const apiRequest = async (url, options = {}) => {
  const token = localStorage.getItem('token');
  
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` })
    }
  };

  const response = await fetch(`${API_BASE_URL}${url}`, {
    ...defaultOptions,
    ...options,
    headers: {
      ...defaultOptions.headers,
      ...options.headers
    }
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }

  return response.json();
};

/**
 * Нормализация номера телефона
 * @param {string} phoneNumber - номер телефона
 * @returns {string|null} нормализованный номер или null
 */
export const normalizePhoneNumber = (phoneNumber) => {
  const digits = String(phoneNumber).replace(/\D/g, '');
  let normalizedPhone = null;
  
  if (digits.length === 11 && digits.startsWith('8')) {
    const d = '7' + digits.slice(1);
    normalizedPhone = `+7(${d.slice(1,4)})${d.slice(4,11)}`;
  } else if (digits.length === 11 && digits.startsWith('7')) {
    const d = digits;
    normalizedPhone = `+7(${d.slice(1,4)})${d.slice(4,11)}`;
  } else if (digits.length === 10) {
    const d = '7' + digits;
    normalizedPhone = `+7(${d.slice(1,4)})${d.slice(4,11)}`;
  }

  return normalizedPhone && PHONE_REGEX.test(normalizedPhone) ? normalizedPhone : null;
};

/**
 * Валидация email
 * @param {string} email - email для проверки
 * @returns {boolean} валидный ли email
 */
export const isValidEmail = (email) => {
  return EMAIL_REGEX.test(email);
};

/**
 * Валидация пароля
 * @param {string} password - пароль для проверки
 * @returns {Object} результат валидации
 */
export const validatePassword = (password) => {
  if (!password) {
    return { isValid: false, message: 'Пароль обязателен' };
  }
  
  if (password.length < VALIDATION.PASSWORD_MIN_LENGTH) {
    return { isValid: false, message: `Пароль должен содержать минимум ${VALIDATION.PASSWORD_MIN_LENGTH} символов` };
  }
  
  if (password.length > VALIDATION.PASSWORD_MAX_LENGTH) {
    return { isValid: false, message: `Пароль не должен превышать ${VALIDATION.PASSWORD_MAX_LENGTH} символов` };
  }
  
  return { isValid: true };
};

/**
 * Валидация имени
 * @param {string} name - имя для проверки
 * @returns {Object} результат валидации
 */
export const validateName = (name) => {
  if (!name) {
    return { isValid: false, message: 'Имя обязательно' };
  }
  
  if (name.length > VALIDATION.NAME_MAX_LENGTH) {
    return { isValid: false, message: `Имя не должно превышать ${VALIDATION.NAME_MAX_LENGTH} символов` };
  }
  
  return { isValid: true };
};

/**
 * Валидация балла ЕГЭ
 * @param {number|string} score - балл для проверки
 * @returns {Object} результат валидации
 */
export const validateExamScore = (score) => {
  const parsedScore = parseInt(score);
  
  if (isNaN(parsedScore)) {
    return { isValid: false, message: 'Балл должен быть числом' };
  }
  
  if (parsedScore < VALIDATION.EXAM_SCORE_MIN || parsedScore > VALIDATION.EXAM_SCORE_MAX) {
    return { isValid: false, message: `Балл должен быть от ${VALIDATION.EXAM_SCORE_MIN} до ${VALIDATION.EXAM_SCORE_MAX}` };
  }
  
  return { isValid: true };
};

/**
 * Форматирование даты
 * @param {string|Date} date - дата для форматирования
 * @returns {string} отформатированная дата
 */
export const formatDate = (date) => {
  const d = new Date(date);
  return d.toLocaleDateString('ru-RU', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Форматирование номера телефона для отображения
 * @param {string} phone - номер телефона
 * @returns {string} отформатированный номер
 */
export const formatPhoneForDisplay = (phone) => {
  if (!phone) return '';
  
  // Если номер начинается с +9, заменяем на +7
  if (phone.startsWith('+9')) {
    return phone.replace('+9', '+7');
  }
  
  return phone;
};

/**
 * Получение статуса заявления на русском языке
 * @param {string} status - статус на английском
 * @returns {string} статус на русском
 */
export const getApplicationStatusText = (status) => {
  const statusMap = {
    pending: 'На рассмотрении',
    approved: 'Одобрено',
    rejected: 'Отклонено'
  };
  
  return statusMap[status] || status;
};

/**
 * Получение роли пользователя на русском языке
 * @param {string} role - роль на английском
 * @returns {string} роль на русском
 */
export const getUserRoleText = (role) => {
  const roleMap = {
    student: 'Студент',
    university_representative: 'Представитель вуза',
    admin: 'Администратор'
  };
  
  return roleMap[role] || role;
};

/**
 * Дебаунс функция
 * @param {Function} func - функция для дебаунса
 * @param {number} delay - задержка в миллисекундах
 * @returns {Function} дебаунсированная функция
 */
export const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  };
};

/**
 * Проверка, является ли пользователь авторизованным
 * @returns {boolean} авторизован ли пользователь
 */
export const isAuthenticated = () => {
  const token = localStorage.getItem('token');
  return !!token;
};

/**
 * Получение данных пользователя из localStorage
 * @returns {Object|null} данные пользователя
 */
export const getUserData = () => {
  try {
    const userData = localStorage.getItem('user');
    return userData ? JSON.parse(userData) : null;
  } catch (error) {
    console.error('Ошибка при получении данных пользователя:', error);
    return null;
  }
};

/**
 * Сохранение данных пользователя в localStorage
 * @param {Object} userData - данные пользователя
 */
export const setUserData = (userData) => {
  localStorage.setItem('user', JSON.stringify(userData));
};

/**
 * Очистка данных пользователя из localStorage
 */
export const clearUserData = () => {
  localStorage.removeItem('user');
  localStorage.removeItem('token');
};
