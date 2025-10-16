// Централизованная конфигурация окружения с безопасными значениями по умолчанию

const env = {
  // Порт сервера (по умолчанию 5000)
  PORT: Number(process.env.PORT || 5000),
  
  // Секретный ключ для JWT токенов
  JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key',
  
  // URL фронтенда для CORS
  FRONTEND_ORIGIN: process.env.FRONTEND_ORIGIN || 'http://localhost:3000',
  
  // Конфигурация базы данных PostgreSQL
  DB: {
    user: process.env.PGUSER || 'postgres',
    host: process.env.PGHOST || 'localhost',
    database: process.env.PGDATABASE || 'UniChoice',
    password: process.env.PGPASSWORD || '23012006ar',
    port: Number(process.env.PGPORT || 5432),
  },
};

module.exports = env;