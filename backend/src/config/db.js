const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'mysql',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'lms_user',
  password: process.env.DB_PASSWORD || 'lms_password',
  database: process.env.DB_NAME || 'lms_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

async function initializeDatabase() {
  const createTableSQL = `
    CREATE TABLE IF NOT EXISTS admissions (
      id BIGINT PRIMARY KEY AUTO_INCREMENT,
      full_name VARCHAR(255) NOT NULL,
      email VARCHAR(255) NOT NULL,
      course VARCHAR(100) NOT NULL,
      status VARCHAR(50) NOT NULL DEFAULT 'Pending',
      submitted_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `;

  const connection = await pool.getConnection();
  try {
    await connection.query(createTableSQL);
    console.log('Database initialized successfully.');
  } finally {
    connection.release();
  }
}

module.exports = {
  pool,
  initializeDatabase
};
