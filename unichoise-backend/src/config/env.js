// Centralized environment configuration with safe defaults for local dev

const env = {
  PORT: Number(process.env.PORT || 5000),
  JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key',
  FRONTEND_ORIGIN: process.env.FRONTEND_ORIGIN || 'http://localhost:3000',
  DB: {
    user: process.env.PGUSER || 'postgres',
    host: process.env.PGHOST || 'localhost',
    database: process.env.PGDATABASE || 'UniChoice',
    password: process.env.PGPASSWORD || '23012006ar',
    port: Number(process.env.PGPORT || 5432),
  },
};

module.exports = env;


