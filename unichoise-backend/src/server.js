/**
 * UniChoice Backend Server
 * 
 * Главный файл сервера, который инициализирует Express приложение,
 * настраивает middleware, подключает маршруты и запускает сервер.
 * 
 * Основные компоненты:
 * - Express сервер с CORS и body-parser
 * - Подключение к PostgreSQL через connection pool
 * - JWT аутентификация и авторизация
 * - API маршруты для университетов, пользователей, заявлений
 * - Централизованная обработка ошибок
 */

// ===== ИМПОРТ ЗАВИСИМОСТЕЙ =====
// Основные библиотеки для работы сервера
const express = require('express');        // Web framework для Node.js
const cors = require('cors');              // Cross-Origin Resource Sharing
const bodyParser = require('body-parser'); // Парсинг JSON в запросах
const jwt = require('jsonwebtoken');       // JSON Web Tokens для аутентификации
const bcrypt = require('bcrypt');          // Хеширование паролей

// Конфигурация и утилиты
const env = require('./config/env');       // Переменные окружения
const pool = require('./db/pool');         // Пул соединений с БД
const { authenticateToken, isAdmin, isRepresentative } = require('./middleware/auth'); // Middleware для авторизации

// ===== ИНИЦИАЛИЗАЦИЯ ПРИЛОЖЕНИЯ =====
const app = express();
const PORT = env.PORT;                     // Порт сервера (по умолчанию 5000)
const JWT_SECRET = env.JWT_SECRET;         // Секретный ключ для JWT токенов
const FRONTEND_ORIGIN = env.FRONTEND_ORIGIN; // URL фронтенда для CORS

// ===== НАСТРОЙКА MIDDLEWARE =====
// CORS политика - разрешаем запросы с фронтенда
app.use(cors({
  origin: FRONTEND_ORIGIN,                    // URL фронтенда
  methods: ['GET', 'POST', 'PUT', 'DELETE'],  // Разрешенные HTTP методы
  allowedHeaders: ['Content-Type', 'Authorization'], // Разрешенные заголовки
}));

// Парсинг JSON в теле запросов
app.use(bodyParser.json());

// ===== ОБРАБОТЧИКИ ГЛОБАЛЬНЫХ ОШИБОК =====
// Обработка необработанных исключений (держит сервер живым)
process.on('uncaughtException', (error) => {
  console.error('Необработанное исключение:', error);
});

// Обработка необработанных отклонений промисов
process.on('unhandledRejection', (error) => {
  console.error('Необработанное отклонение промиса:', error);
});

// ===== ПОДКЛЮЧЕНИЕ К БАЗЕ ДАННЫХ =====
// Проверяем соединение с PostgreSQL
pool.connect()
  .then(() => {
    console.log('✅ Успешное подключение к базе данных');
  })
  .catch((err) => {
    console.error('❌ Ошибка подключения к базе данных:', err);
  });

// ===== ПОДКЛЮЧЕНИЕ МАРШРУТОВ =====
// Импортируем роутеры для разных частей API
const authRouter = require('./routes/auth.routes');           // Аутентификация (login, register, logout)
const universitiesRouter = require('./routes/universities.routes'); // Университеты и связанные данные

// Регистрируем маршруты
app.use(authRouter);                    // Маршруты аутентификации на корневом пути
app.use('/universities', universitiesRouter); // Маршруты университетов на /universities

// ===== СТАРЫЕ МАРШРУТЫ УДАЛЕНЫ =====
// Все маршруты университетов перенесены в ./routes/universities.routes.js
// Все маршруты аутентификации перенесены в ./routes/auth.routes.js

// ===== ДОПОЛНИТЕЛЬНЫЕ МАРШРУТЫ =====
// Эти маршруты пока остаются в основном файле, но могут быть перенесены в отдельные роутеры

// Получение топового университета по рейтингу
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

// ===== ОБРАБОТКА ОШИБОК =====
// Централизованная обработка ошибок - ловит все необработанные ошибки
app.use((err, req, res, next) => {
  console.error('Ошибка сервера:', err);
  
  // Ошибки валидации данных
  if (err.name === 'ValidationError') {
    return res.status(400).json({ 
      message: 'Ошибка валидации', 
      details: err.message 
    });
  }
  
  // Ошибки авторизации
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({ 
      message: 'Неавторизованный доступ' 
    });
  }
  
  // PostgreSQL ошибки
  if (err.code === '23505') { // Нарушение уникальности
    return res.status(409).json({ 
      message: 'Запись с такими данными уже существует' 
    });
  }
  
  if (err.code === '23503') { // Нарушение внешнего ключа
    return res.status(400).json({ 
      message: 'Нарушение связности данных' 
    });
  }
  
  // Общие ошибки сервера
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

// ===== ЗАПУСК СЕРВЕРА =====
// Запускаем сервер на указанном порту
app.listen(PORT, () => {
  console.log(`🚀 Сервер запущен на порту ${PORT}`);
  console.log(`📡 API доступно по адресу: http://localhost:${PORT}`);
  console.log(`🌐 Фронтенд: ${FRONTEND_ORIGIN}`);
});