// Настройка подключения к базе данных PostgreSQL
const { Pool } = require('pg');
const env = require('../config/env');

// Создание пула соединений для эффективного управления подключениями к БД
const pool = new Pool(env.DB);

module.exports = pool;


