/**
 * Конфигурация переменных окружения
 * 
 * Централизованное управление настройками приложения.
 * Использует переменные окружения с безопасными значениями по умолчанию для разработки.
 * 
 * Для продакшена обязательно установите переменные окружения:
 * - JWT_SECRET: секретный ключ для подписи JWT токенов
 * - DB_PASSWORD: пароль от базы данных
 * - FRONTEND_ORIGIN: URL фронтенда для CORS
 */

const env = {
  // Порт сервера (по умолчанию 5000)
  PORT: Number(process.env.PORT || 5000),
  
  // Секретный ключ для JWT токенов (ОБЯЗАТЕЛЬНО измените в продакшене!)
  JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key',
  
  // URL фронтенда для настройки CORS
  FRONTEND_ORIGIN: process.env.FRONTEND_ORIGIN || 'http://localhost:3000',
  
  // Настройки подключения к PostgreSQL
  DB: {
    user: process.env.PGUSER || 'postgres',           // Пользователь БД
    host: process.env.PGHOST || 'localhost',          // Хост БД
    database: process.env.PGDATABASE || 'UniChoice',  // Имя базы данных
    password: process.env.PGPASSWORD || '23012006ar', // Пароль (ОБЯЗАТЕЛЬНО измените!)
    port: Number(process.env.PGPORT || 5432),         // Порт PostgreSQL
  },
};

module.exports = env;


