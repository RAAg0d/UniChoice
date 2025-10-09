const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'UniChoice',
  password: '23012006ar',
  port: 5432,
});

module.exports = pool;