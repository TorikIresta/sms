import { db } from "../db.js";

export const getAllStudents = () => {
  return new Promise((resolve, reject) => {
    db.query("SELECT * FROM siswa ORDER BY nama ASC", (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

export const addStudent = (data) => {
  return new Promise((resolve, reject) => {
    const sql = `INSERT INTO siswa SET ?`;
    db.query(sql, data, (err, result) => {
      if (err) reject(err);
      else resolve({ id: result.insertId, ...data });
    });
  });
};

export const updateStudent = (id, data) => {
  return new Promise((resolve, reject) => {
    const sql = `UPDATE siswa SET ? WHERE id = ?`;
    db.query(sql, [data, id], (err) => {
      if (err) reject(err);
      else resolve({ id, ...data });
    });
  });
};

export const deleteStudent = (id) => {
  return new Promise((resolve, reject) => {
    db.query(`DELETE FROM siswa WHERE id = ?`, [id], (err) => {
      if (err) reject(err);
      else resolve(true);
    });
  });
};
