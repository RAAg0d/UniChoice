const bcrypt = require('bcrypt');
const pool = require('./src/db/pool');

async function createAdmin() {
  try {
    // Хешируем пароль
    const hashedPassword = await bcrypt.hash('securepassword', 10);
    
    // Создаем администратора
    const result = await pool.query(
      `INSERT INTO users (users_id, full_name, email, password, user_type, is_banned, exam_score) 
       VALUES ($1, $2, $3, $4, $5, $6, $7) 
       RETURNING users_id, email, full_name, user_type`,
      [1, 'Администратор', 'admin@gmail.com', hashedPassword, 'admin', 'No', null]
    );
    
    console.log('Администратор создан:', result.rows[0]);
    await pool.end();
  } catch (error) {
    console.error('Ошибка при создании администратора:', error);
    await pool.end();
  }
}

createAdmin();
