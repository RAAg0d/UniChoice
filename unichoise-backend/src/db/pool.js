const { Pool } = require('pg');
const env = require('../config/env');

// Single shared connection pool
const pool = new Pool(env.DB);

module.exports = pool;


