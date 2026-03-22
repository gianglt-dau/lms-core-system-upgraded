const { pool } = require('../config/db');

async function createAdmission({ fullName, email, course }) {
  const sql = `
    INSERT INTO admissions (full_name, email, course, status)
    VALUES (?, ?, ?, ?)
  `;
  const values = [fullName, email, course, 'Pending'];

  const [result] = await pool.execute(sql, values);

  return findAdmissionById(result.insertId);
}

async function findAdmissionById(id) {
  const [rows] = await pool.execute(
    `
    SELECT
      id,
      full_name AS fullName,
      email,
      course,
      status,
      submitted_at AS submittedAt
    FROM admissions
    WHERE id = ?
    `,
    [id]
  );

  return rows[0] || null;
}

async function getAllAdmissions() {
  const [rows] = await pool.execute(`
    SELECT
      id,
      full_name AS fullName,
      email,
      course,
      status,
      submitted_at AS submittedAt
    FROM admissions
    ORDER BY id DESC
  `);

  return rows;
}

module.exports = {
  createAdmission,
  getAllAdmissions
};
